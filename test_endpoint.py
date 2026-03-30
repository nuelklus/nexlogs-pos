#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
django.setup()

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from apps.products.models import Product

@csrf_exempt
def test_update_stock(request):
    """
    Simple test endpoint for stock updates
    """
    if request.method == 'PATCH':
        try:
            product_id = 27  # Hard-coded for testing
            product = Product.objects.get(id=product_id)
            
            print(f"✅ Found product: {product.name}")
            print(f"✅ Current stock: {product.stock_quantity}")
            
            product.stock_quantity = 999
            product.save()
            
            print(f"✅ Updated stock to: {product.stock_quantity}")
            
            return JsonResponse({
                'success': True,
                'message': 'Stock updated successfully',
                'product_id': product.id,
                'new_stock': product.stock_quantity
            })
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'message': 'Only PATCH method allowed'
    }, status=405)
