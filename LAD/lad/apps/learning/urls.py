# apps/learning/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    UnitViewSet,
    LevelViewSet,
    StudentRegistrationView,
    hit_objective,
)

router = DefaultRouter()
router.register(r"units", UnitViewSet, basename="unit")
router.register(r"levels", LevelViewSet, basename="level")

# Mapea explícito a acciones detail=True del ViewSet (opcionales si ya usas las del router)
level_complete = LevelViewSet.as_view({"post": "complete"})
level_reset = LevelViewSet.as_view({"post": "reset"})

urlpatterns = [
    # Rutas generadas por el router
    path("", include(router.urls)),

    # Endpoints adicionales
    path("register/", StudentRegistrationView.as_view(), name="student-register"),
    path("progress/objective/<str:code>/hit/", hit_objective, name="objective-hit"),

    # Rutas explícitas equivalentes a las del router (útiles si quieres URLs dedicadas)
    path("levels/<slug:slug>/complete/", level_complete, name="level-complete"),
    path("levels/<slug:slug>/reset/", level_reset, name="level-reset"),
]
