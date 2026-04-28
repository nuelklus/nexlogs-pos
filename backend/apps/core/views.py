from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache

def health_check(request):
    """
    Health check endpoint for Render
    Returns 200 if all services are healthy
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    # Check cache
    try:
        cache.set('health_check', 'ok', 10)
        cache_status = "healthy" if cache.get('health_check') == 'ok' else "unhealthy"
    except Exception:
        cache_status = "unhealthy"
    
    # Overall status
    overall_status = "healthy" if db_status == "healthy" and cache_status == "healthy" else "unhealthy"
    
    response_data = {
        "status": overall_status,
        "database": db_status,
        "cache": cache_status,
        "version": "1.0.0"
    }
    
    status_code = 200 if overall_status == "healthy" else 503
    return JsonResponse(response_data, status=status_code)
