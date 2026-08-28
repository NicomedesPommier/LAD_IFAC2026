import os
from pathlib import Path
from datetime import timedelta

from django.core.exceptions import ImproperlyConfigured

from .ip_config import load_network_config

BASE_DIR = Path(__file__).resolve().parent.parent

# Load LAD/lad/.env (if present) into the process environment before reading any
# settings below. No-op when the file or python-dotenv is absent, so local dev
# without a .env is unaffected.
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    pass

# --- Carga de red centralizada ---
NETWORK_CONFIG = load_network_config()


def _env_list(name):
    """Comma-separated env var -> list of trimmed, non-empty values."""
    return [s.strip() for s in os.environ.get(name, '').split(',') if s.strip()]

# Seguridad / Debug
# Dev-only fallback key. Production MUST provide DJANGO_SECRET_KEY (enforced below when DEBUG=False).
_INSECURE_SECRET_KEY = 'django-insecure-!px)fft@n1i7)6@2&-l@ekdxz4qz$m4u8*^f23e%-d#cm=cvqn'
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', _INSECURE_SECRET_KEY)
DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

# ALLOWED_HOSTS — permissive by default so the platform works on any LAN/IP
# without needing to reconfigure after every network change.
# Override with DJANGO_ALLOWED_HOSTS env var for stricter production deployments.
_allowed_hosts = _env_list('DJANGO_ALLOWED_HOSTS')
ALLOWED_HOSTS = _allowed_hosts or ['*']

# ── Production hardening ───────────────────────────────────────────────────────
# When DEBUG is off (public / tunnel deployments), refuse to boot on insecure
# configuration and enable HTTPS-oriented protections. Dev (DEBUG=True) is
# unaffected, so the trusted-LAN classroom workflow keeps working unchanged.
if not DEBUG:
    if not SECRET_KEY or SECRET_KEY == _INSECURE_SECRET_KEY:
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY must be set to a strong, non-default value when DJANGO_DEBUG=false. "
            "The committed dev key is public — generate and rotate to a fresh key for production."
        )
    if not _allowed_hosts or '*' in ALLOWED_HOSTS:
        raise ImproperlyConfigured(
            "DJANGO_ALLOWED_HOSTS must list explicit hostname(s) without '*' when DJANGO_DEBUG=false."
        )

    # TLS is terminated by the reverse proxy / tunnel; trust its forwarded scheme.
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

# Registration gate — when set (e.g. for a public/tunnel beta), POST /api/register/
# requires a matching invite code. Empty = open registration (local/LAN dev default).
REGISTRATION_INVITE_CODE = os.environ.get('REGISTRATION_INVITE_CODE', '')

# Apps
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # 3rd party
    'rest_framework',
    'corsheaders',
    'channels',

    # Local
    "apps.learning.apps.LearningConfig",
    "apps.analytics.apps.AnalyticsConfig",
    "workspace.apps.WorkspaceConfig",
]

# ASGI application (enables channels + WebSocket support)
ASGI_APPLICATION = 'core.asgi.application'

# Channel layers (in-memory for single-server dev; swap for Redis in production)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Secure-by-default: every endpoint requires auth unless it explicitly opts
    # out with @permission_classes([AllowAny]) (register, token, analytics
    # ingest/heartbeat, serve_mesh). Prevents a future view from leaking by
    # forgetting its decorator.
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    # Baseline abuse protection (login/registration brute force, anonymous
    # telemetry spam). Tighten per-endpoint with ScopedRateThrottle if needed.
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "120/min",
        "user": "1000/min",
    },
}

# Middleware (orden correcto para admin)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',                # CORS alto en la pila
    'django.contrib.sessions.middleware.SessionMiddleware', # requerido por admin
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',  # requerido por admin
    'django.contrib.messages.middleware.MessageMiddleware',     # requerido por admin
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.analytics.middleware.RequestMetricsMiddleware',       # logs http_request events (after auth)
]

# URLs / WSGI
ROOT_URLCONF = "core.urls"
WSGI_APPLICATION = 'core.wsgi.application'

# Templates (como tenías)
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],  # agrega BASE_DIR / 'templates' si usas plantillas propias
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# DB
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        # busy-timeout: wait up to 20s for a competing writer instead of
        # immediately raising "database is locked". CONN_MAX_AGE reuses the
        # connection across requests (skip per-request connect/teardown). WAL
        # journal mode is enabled per-connection via the connection_created
        # signal in apps/analytics/apps.py.
        'OPTIONS': {'timeout': 20},
        'CONN_MAX_AGE': 60,
    }
}

# Passwords
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# CORS / CSRF (usando origen derivado)
CORS_ALLOW_CREDENTIALS = True
# Evitamos CORS_ALLOW_ALL_ORIGINS=True porque ya declaras listas controladas
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    NETWORK_CONFIG.frontend_origin,  # p.ej. http://<tu-ip-lan>:3000 o https si cambias scheme
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    NETWORK_CONFIG.frontend_origin,
]

# Extra trusted origins for tunnel / reverse-proxy deployments — comma-separated
# full origins (e.g. https://lad.example.com). Appended to both CORS and CSRF
# trust so the public tunnel hostname is accepted without editing this file.
_extra_origins = _env_list('DJANGO_EXTRA_ORIGINS')
if _extra_origins:
    CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS + _extra_origins
    CSRF_TRUSTED_ORIGINS = CSRF_TRUSTED_ORIGINS + _extra_origins

# i18n
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static / Media
STATIC_URL = 'static/'
MEDIA_URL = '/images/'

STATIC_ROOT = str(BASE_DIR / 'static_collected')
MEDIA_ROOT = str(BASE_DIR / 'static' / 'images')

STATICFILES_DIRS = [
    BASE_DIR / 'static',  # asegúrate de crear esta carpeta
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=90),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,

    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',

    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# ── Optional Postgres via DATABASE_URL ──────────────────────────────────────
# Additive override — the SQLite default above stays in effect unless DATABASE_URL
# is set. Implements the previously documented-but-unwired DATABASE_URL. Format:
#   postgresql://USER:PASSWORD@HOST:PORT/NAME
# Needed for real multi-worker concurrency (SQLite's single writer is the ceiling).
_db_url = os.environ.get('DATABASE_URL', '')
if _db_url.startswith(('postgres://', 'postgresql://')):
    from urllib.parse import urlparse as _urlparse
    _pg = _urlparse(_db_url)
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': _pg.path.lstrip('/'),
        'USER': _pg.username or '',
        'PASSWORD': _pg.password or '',
        'HOST': _pg.hostname or 'localhost',
        'PORT': str(_pg.port or 5432),
        'CONN_MAX_AGE': 60,
    }
