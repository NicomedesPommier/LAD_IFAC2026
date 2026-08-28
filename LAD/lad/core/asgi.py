"""
ASGI config — Django Channels for WebSocket PTY terminal support.

Routes:
  http  → Django ASGI app (REST API, admin, etc.)
  ws    → workspace.routing.websocket_urlpatterns (PTY terminal)

The OriginValidator allows connections from the React dev server (port 3000)
and from any host listed in ALLOWED_HOSTS (for production).

IMPORTANT ordering: DJANGO_SETTINGS_MODULE must be set and get_asgi_application()
(which runs django.setup()) must be called BEFORE importing anything that touches
models (workspace.routing -> consumers -> models). Otherwise a standalone ASGI
server (daphne / uvicorn / gunicorn) raises AppRegistryNotReady on boot —
`runserver` happens to call django.setup() first, which masked this.
"""

import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from django.core.asgi import get_asgi_application

# Load Django apps before importing model-dependent modules below.
django_asgi_app = get_asgi_application()

from django.conf import settings
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator
from workspace.routing import websocket_urlpatterns


# Build allowed WebSocket origins from ALLOWED_HOSTS + common dev ports
def _build_ws_origins():
    origins = []
    for host in getattr(settings, 'ALLOWED_HOSTS', []):
        if host in ('*', ''):
            continue
        for scheme in ('http', 'https'):
            origins.append(f'{scheme}://{host}')
            # Include common dev ports
            for port in (3000, 8000, 8080):
                origins.append(f'{scheme}://{host}:{port}')
    return origins


# Defer origin list until settings are loaded
class _LazyOriginValidator(OriginValidator):
    def __init__(self, application):
        # Pass empty list; we override valid_origin below
        super().__init__(application, allowed_origins=[])
        self._application_inner = application

    def valid_origin(self, parsed_origin):
        # Allow all origins in DEBUG mode (dev only)
        if settings.DEBUG:
            return True
        allowed = _build_ws_origins()
        return super().valid_origin(parsed_origin) or \
               f'{parsed_origin.scheme}://{parsed_origin.netloc}' in allowed


application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': _LazyOriginValidator(
        URLRouter(websocket_urlpatterns)
    ),
})
