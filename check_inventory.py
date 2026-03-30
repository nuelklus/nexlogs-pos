#!/usr/bin/env python
import os
import sys
import django
from django.db.models import F

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
django.setup()

from apps.products.models import Product

print("=== Product Inventory Analysis ===")
products = Product.objects.all()
print(f"Total products: {products.count()}")

print("\n=== Low Stock Analysis ===")
low_stock_products = Product.objects.filter(
    stock_quantity__lte=F('low_stock_threshold')
)
print(f"Low stock count: {low_stock_products.count()}")

print("\n=== All Products (first 10) ===")
for product in products[:10]:
    is_low_stock = product.stock_quantity <= product.low_stock_threshold
    status = "LOW STOCK" if is_low_stock else "OK"
    print(f"- {product.name}: stock={product.stock_quantity}, threshold={product.low_stock_threshold} -> {status}")

print("\n=== Exact Low Stock Products ===")
for product in low_stock_products:
    print(f"- {product.name}: {product.stock_quantity} (threshold: {product.low_stock_threshold})")
