"""Core views for utility endpoints."""
from django.http import JsonResponse
from django.db import connection
from .ip_config import load_network_config


def network_config_view(request):
    """Return network configuration."""
    cfg = load_network_config()
    return JsonResponse(cfg.as_dict())


def health_check_view(request):
    """Health check endpoint for Kubernetes probes."""
    try:
        # Check database connectivity
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")

        return JsonResponse({
            "status": "healthy",
            "database": "connected"
        })
    except Exception as e:
        return JsonResponse({
            "status": "unhealthy",
            "error": str(e)
        }, status=503)
