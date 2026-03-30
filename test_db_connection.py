#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
django.setup()

print("=== Environment Variables Check ===")
print(f"SUPABASE_DB_NAME: {os.getenv('SUPABASE_DB_NAME')}")
print(f"SUPABASE_DB_USER: {os.getenv('SUPABASE_DB_USER')}")
print(f"SUPABASE_DB_PASSWORD: {'SET' if os.getenv('SUPABASE_DB_PASSWORD') else 'NOT SET'}")
print(f"SUPABASE_DB_HOST: {os.getenv('SUPABASE_DB_HOST')}")
print(f"SUPABASE_DB_PORT: {os.getenv('SUPABASE_DB_PORT')}")

print("\n=== Database Connection Test ===")
from django.db import connection
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        print("✅ Database connection successful!")
        print(f"Result: {result}")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print(f"Error type: {type(e)}")
