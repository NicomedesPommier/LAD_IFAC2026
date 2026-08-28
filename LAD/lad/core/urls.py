from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.views import LogoutView

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import network_config_view, health_check_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/health/", health_check_view, name="health-check"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/config/network/", network_config_view, name="network-config"),
    path("api/", include("apps.learning.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/workspace/", include("workspace.urls")),
]
