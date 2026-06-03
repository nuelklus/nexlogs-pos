from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from apps.products import views as product_views

# Create router for POS endpoints
router = DefaultRouter()
router.register(r'products', views.POSProductViewSet, basename='pos-products')

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.pos_login, name='pos-login'),
    path('auth/refresh/', views.pos_refresh, name='pos-refresh'),
    path('auth/logout/', views.pos_logout, name='pos-logout'),
    
    # Product-related endpoints
    path('', include(router.urls)),
    
    # Categories and brands (reused from products app)
    path('categories/', product_views.product_categories, name='pos-categories'),
    path('brands/', product_views.product_brands, name='pos-brands'),
    
    # Health check
    path('health/', views.pos_health_check, name='pos-health-check'),
    
    # Low stock alerts
    path('alerts/low-stock/', views.low_stock_alerts, name='pos-low-stock-alerts'),
    
    # Transaction endpoints
    path('transactions/', views.transaction_history, name='pos-transaction-history'),
    path('transactions/create/', views.create_transaction, name='pos-create-transaction'),
    path('transactions/<str:transaction_id>/', views.transaction_detail, name='pos-transaction-detail'),
    path('refunds/', views.create_refund, name='pos-create-refund'),
]

# API documentation
app_name = 'pos'
