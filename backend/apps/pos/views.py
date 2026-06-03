from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import transaction, models
from apps.products.models import Product, StockSyncLog
from apps.products.serializers import ProductListSerializer, ProductCreateUpdateSerializer
from apps.accounts.models import StaffRole
from .serializers import (
    POSProductSerializer, StockUpdateSerializer, BulkStockUpdateSerializer,
    StockSyncLogSerializer, LowStockAlertSerializer, TransactionSerializer,
    CreateTransactionSerializer, TransactionItemSerializer, RefundSerializer
)
from .models import Transaction, TransactionItem, Refund
from .permissions import CanUpdateStock, CanCreateProduct
import json

class POSProductViewSet(viewsets.ModelViewSet):
    """POS-specific product endpoints"""
    serializer_class = ProductListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return active products with POS-specific fields"""
        return Product.objects.filter(is_active=True).select_related('category', 'brand')
    
    def list(self, request, *args, **kwargs):
        """Optimized list for POS - includes barcode and stock info"""
        queryset = self.get_queryset()
        
        # Filter by store if specified
        store_id = request.query_params.get('store_id', 'main')
        queryset = queryset.filter(pos_store_id=store_id)
        
        # Search by barcode if provided
        barcode = request.query_params.get('barcode')
        if barcode:
            queryset = queryset.filter(barcode__icontains=barcode)
        
        # Search by name/SKU if provided
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) | 
                models.Q(sku__icontains=search) |
                models.Q(barcode__icontains=search)
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count(),
            'store_id': store_id
        })
    
    @action(detail=False, methods=['post'], permission_classes=[CanUpdateStock])
    def update_stock(self, request):
        """Update stock from POS with conflict resolution"""
        product_id = request.data.get('product_id')
        new_quantity = request.data.get('quantity')
        change_amount = request.data.get('change_amount', 0)
        store_id = request.data.get('store_id', 'main')
        device_id = request.data.get('device_id', 'unknown')
        
        if not product_id or new_quantity is None:
            return Response({
                'error': 'product_id and quantity are required'
            }, status=400)
        
        try:
            with transaction.atomic():
                product = Product.objects.select_for_update().get(id=product_id)
                old_quantity = product.stock_quantity
                
                # Check for version conflicts
                current_version = product.stock_sync_version
                submitted_version = request.data.get('sync_version', 0)
                
                if submitted_version and current_version != submitted_version:
                    # Conflict detected
                    StockSyncLog.objects.create(
                        product=product,
                        old_quantity=old_quantity,
                        new_quantity=new_quantity,
                        change_amount=change_amount,
                        source='pos',
                        store_id=store_id,
                        operator=request.user.username,
                        device_id=device_id,
                        sync_status='conflict',
                        conflict_reason=f'Version mismatch: expected {current_version}, got {submitted_version}'
                    )
                    
                    return Response({
                        'error': 'Stock version conflict',
                        'current_version': current_version,
                        'submitted_version': submitted_version,
                        'current_quantity': old_quantity
                    }, status=409)
                
                # Update stock
                product.stock_quantity = new_quantity
                product.pos_stock_quantity = new_quantity
                product.last_pos_sync = timezone.now()
                product.stock_updated_by = request.user.username
                product.stock_update_source = 'pos'
                product.stock_sync_version += 1
                product.save()
                
                # Log successful sync
                sync_log = StockSyncLog.objects.create(
                    product=product,
                    old_quantity=old_quantity,
                    new_quantity=new_quantity,
                    change_amount=change_amount,
                    source='pos',
                    store_id=store_id,
                    operator=request.user.username,
                    device_id=device_id,
                    sync_status='completed',
                    completed_at=timezone.now()
                )
                
                return Response({
                    'status': 'success',
                    'product_id': product_id,
                    'product_name': product.name,
                    'old_quantity': old_quantity,
                    'new_quantity': new_quantity,
                    'change_amount': change_amount,
                    'sync_version': product.stock_sync_version,
                    'sync_log_id': sync_log.id,
                    'timestamp': sync_log.timestamp.isoformat()
                })
                
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)
        except Exception as e:
            return Response({
                'error': 'Internal server error',
                'detail': str(e)
            }, status=500)
    
    @action(detail=False, methods=['post'], permission_classes=[CanUpdateStock])
    def bulk_stock_update(self, request):
        """Update multiple products stock at once"""
        updates = request.data.get('updates', [])
        store_id = request.data.get('store_id', 'main')
        device_id = request.data.get('device_id', 'unknown')
        
        if not updates:
            return Response({'error': 'No updates provided'}, status=400)
        
        results = []
        errors = []
        
        with transaction.atomic():
            for update_data in updates:
                try:
                    product_id = update_data.get('product_id')
                    new_quantity = update_data.get('quantity')
                    change_amount = update_data.get('change_amount', 0)
                    
                    if not product_id or new_quantity is None:
                        errors.append({
                            'product_id': product_id,
                            'error': 'Missing product_id or quantity'
                        })
                        continue
                    
                    product = Product.objects.select_for_update().get(id=product_id)
                    old_quantity = product.stock_quantity
                    
                    # Version check
                    current_version = product.stock_sync_version
                    submitted_version = update_data.get('sync_version', 0)
                    
                    if submitted_version and current_version != submitted_version:
                        errors.append({
                            'product_id': product_id,
                            'error': 'Version conflict',
                            'current_version': current_version
                        })
                        continue
                    
                    # Update product
                    product.stock_quantity = new_quantity
                    product.pos_stock_quantity = new_quantity
                    product.last_pos_sync = timezone.now()
                    product.stock_updated_by = request.user.username
                    product.stock_update_source = 'pos'
                    product.stock_sync_version += 1
                    product.save()
                    
                    # Log sync
                    StockSyncLog.objects.create(
                        product=product,
                        old_quantity=old_quantity,
                        new_quantity=new_quantity,
                        change_amount=change_amount,
                        source='pos',
                        store_id=store_id,
                        operator=request.user.username,
                        device_id=device_id,
                        sync_status='completed',
                        completed_at=timezone.now()
                    )
                    
                    results.append({
                        'product_id': product_id,
                        'status': 'success',
                        'new_quantity': new_quantity,
                        'sync_version': product.stock_sync_version
                    })
                    
                except Product.DoesNotExist:
                    errors.append({
                        'product_id': product_id,
                        'error': 'Product not found'
                    })
                except Exception as e:
                    errors.append({
                        'product_id': product_id,
                        'error': str(e)
                    })
        
        return Response({
            'results': results,
            'errors': errors,
            'processed': len(updates),
            'successful': len(results),
            'failed': len(errors)
        })
    
    @action(detail=False, methods=['get'])
    def sync_status(self, request):
        """Get synchronization status for products"""
        store_id = request.query_params.get('store_id', 'main')
        
        # Get recent sync logs
        recent_logs = StockSyncLog.objects.filter(
            store_id=store_id,
            timestamp__gte=timezone.now() - timezone.timedelta(hours=24)
        ).order_by('-timestamp')[:100]
        
        # Get pending syncs
        pending_syncs = StockSyncLog.objects.filter(
            store_id=store_id,
            sync_status='pending'
        ).count()
        
        # Get failed syncs
        failed_syncs = StockSyncLog.objects.filter(
            store_id=store_id,
            sync_status='failed',
            timestamp__gte=timezone.now() - timezone.timedelta(hours=24)
        ).count()
        
        return Response({
            'store_id': store_id,
            'pending_syncs': pending_syncs,
            'failed_syncs': failed_syncs,
            'recent_logs': [
                {
                    'id': str(log.id),
                    'product_id': log.product.id,
                    'product_name': log.product.name,
                    'old_quantity': log.old_quantity,
                    'new_quantity': log.new_quantity,
                    'change_amount': log.change_amount,
                    'source': log.source,
                    'operator': log.operator,
                    'sync_status': log.sync_status,
                    'timestamp': log.timestamp.isoformat()
                }
                for log in recent_logs
            ]
        })
    
    @action(detail=False, methods=['post'], permission_classes=[CanCreateProduct])
    def create_product(self, request):
        """Create a new product from POS (Admin, Manager, Inventory Staff only)"""
        serializer = ProductCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            # Set POS-specific fields
            product.pos_store_id = request.data.get('store_id', 'main')
            product.pos_stock_quantity = product.stock_quantity
            product.last_pos_sync = timezone.now()
            product.save()
            return Response(ProductListSerializer(product).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pos_health_check(request):
    """Health check endpoint for POS system"""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'user': request.user.username,
        'version': '1.0.0'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def pos_login(request):
    """POS-specific login endpoint"""
    username = request.data.get('username')
    password = request.data.get('password')
    store_id = request.data.get('store_id', 'main')
    
    if not username or not password:
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Authenticate user
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({
            'error': 'Account is disabled'
        }, status=status.HTTP_401_UNAUTHORIZED)
    # ROLE CHECK
    if user.role != 'STAFF':
        return Response({
            'error': 'Only staff users can login to POS'
        }, status=status.HTTP_403_FORBIDDEN)
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    # Calculate actual expiration time from JWT settings
    access_token_lifetime = jwt_settings.ACCESS_TOKEN_LIFETIME
    expires_in_seconds = int(access_token_lifetime.total_seconds())
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': getattr(user, 'role', 'STAFF'),
            'staff_role': getattr(user, 'staff_role', None),
        },
        'store_id': store_id,
        'expires_in': expires_in_seconds
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pos_refresh(request):
    """Refresh POS token"""
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        refresh = RefreshToken(refresh_token)
        return Response({
            'access': str(refresh.access_token),
            'expires_in': 3600
        })
    except Exception as e:
        return Response({
            'error': 'Invalid refresh token'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pos_logout(request):
    """POS logout endpoint"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out'})
    except Exception:
        return Response({'message': 'Successfully logged out'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def low_stock_alerts(request):
    """Get products with low stock for POS"""
    store_id = request.query_params.get('store_id', 'main')
    threshold = int(request.query_params.get('threshold', 5))
    
    products = Product.objects.filter(
        is_active=True,
        track_stock=True,
        stock_quantity__lte=threshold
    ).select_related('category', 'brand').order_by('stock_quantity')
    
    serializer = ProductListSerializer(products, many=True)
    
    return Response({
        'store_id': store_id,
        'threshold': threshold,
        'count': products.count(),
        'products': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_history(request):
    """Get transaction history for current store"""
    try:
        transactions = Transaction.objects.filter(
            store_id=request.user.userprofile.store_id,
            status='completed'
        ).select_related('user').prefetch_related('items').order_by('-created_at')[:50]
        
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch transaction history: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_transaction(request):
    """Create a new transaction (cash only)"""
    try:
        with transaction.atomic():
            # Validate request data
            serializer = CreateTransactionSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data = serializer.validated_data
            
            # Create transaction
            transaction_obj = Transaction.objects.create(
                user=request.user,
                store_id=data['store_id'],
                device_id=data.get('device_id'),
                payment_method='cash',  # Only cash enabled for now
                subtotal=data['subtotal'],
                tax_amount=data['tax_amount'],
                total_amount=data['total_amount'],
                amount_paid=data['amount_paid'],
                change_amount=data['amount_paid'] - data['total_amount'],
                status='completed',
                completed_at=timezone.now(),
                notes=data.get('notes', '')
            )
            
            # Create transaction items and update inventory
            for item_data in data['items']:
                product = Product.objects.get(id=item_data['product_id'])
                
                # Create transaction item
                TransactionItem.objects.create(
                    transaction=transaction_obj,
                    product=product,
                    quantity=item_data['quantity'],
                    unit_price=item_data['unit_price'],
                    total_price=item_data['total_price'],
                    product_name=product.name,
                    product_sku=product.sku,
                    product_barcode=product.barcode
                )
                
                # Update product inventory
                product.stock_quantity -= item_data['quantity']
                product.stock_updated_by = request.user.username
                product.stock_update_source = 'POS Sale'
                product.stock_update_timestamp = timezone.now()
                product.save()
            
            # Return complete transaction data
            response_serializer = TransactionSerializer(transaction_obj)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
    except Product.DoesNotExist:
        return Response(
            {'error': 'One or more products not found'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to create transaction: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_detail(request, transaction_id):
    """Get details of a specific transaction"""
    try:
        transaction_obj = Transaction.objects.filter(
            transaction_id=transaction_id,
            store_id=request.user.userprofile.store_id
        ).select_related('user').prefetch_related('items').first()
        
        if not transaction_obj:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = TransactionSerializer(transaction_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch transaction: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_refund(request):
    """Create a refund for a transaction"""
    try:
        with transaction.atomic():
            serializer = RefundSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data = serializer.validated_data
            
            # Get transaction
            transaction_obj = Transaction.objects.filter(
                transaction_id=data['transaction_id'],
                store_id=request.user.userprofile.store_id,
                status='completed'
            ).first()
            
            if not transaction_obj:
                return Response(
                    {'error': 'Transaction not found or already refunded'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create refund
            refund_obj = Refund.objects.create(
                transaction=transaction_obj,
                user=request.user,
                store_id=request.user.userprofile.store_id,
                reason=data['reason'],
                amount=data['amount'],
                notes=data.get('notes', '')
            )
            
            # Restore inventory
            for item in transaction_obj.items.all():
                product = item.product
                product.stock_quantity += item.quantity
                product.stock_updated_by = request.user.username
                product.stock_update_source = 'Refund'
                product.stock_update_timestamp = timezone.now()
                product.save()
            
            # Return refund data
            response_serializer = RefundSerializer(refund_obj)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response(
            {'error': f'Failed to create refund: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
