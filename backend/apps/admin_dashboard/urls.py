from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/stats/", views.dashboard_stats, name="dashboard_stats"),
    path("orders/", views.admin_orders, name="admin_orders"),
    path("orders/<uuid:order_id>/", views.admin_order_detail, name="admin_order_detail"),
    path("inventory/", views.admin_inventory, name="admin_inventory"),
    path("inventory/<int:product_id>/", views.admin_update_stock, name="admin_update_stock"),
    path("inventory/<int:product_id>/restock/", views.admin_restock_product, name="admin_restock_product"),
]
