# apps/learning/views.py
from django.utils import timezone
from django.db.models import Sum, Prefetch

from rest_framework import permissions, viewsets, decorators, response, status, generics
from rest_framework.decorators import api_view, permission_classes

from .models import (
    Unit, Level, Objective,
    UserProgress, ObjectiveProgress, UnitProgress
)
from .serializers import (
    UnitSerializer,
    LevelSerializer,
    StudentRegistrationSerializer,
)


# =========================
# UnitViewSet
# =========================
class UnitViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Lista unidades activas con niveles/objetivos y prefetch del progreso del usuario.
    """
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "slug"
    lookup_value_regex = r"[^/]+"

    def get_queryset(self):
        user = self.request.user

        # Prefetch de niveles activos y ordenados (Level sí tiene is_active/order)
        levels_qs = Level.objects.filter(is_active=True).order_by("order")

        # Objective NO tiene is_active ni order -> ordenar por un campo existente
        objectives_qs = Objective.objects.all().order_by("code")

        # Prefetch del progreso del usuario
        oprefetch = Prefetch(
            "levels__objectives__objectiveprogress_set",
            queryset=ObjectiveProgress.objects.filter(user=user),
        )
        uprefetch = Prefetch(
            "levels__userprogress_set",
            queryset=UserProgress.objects.filter(user=user),
        )

        return (
            Unit.objects.filter(is_active=True)
            .order_by("order")
            .prefetch_related(
                Prefetch("levels", queryset=levels_qs),
                Prefetch("levels__objectives", queryset=objectives_qs),
                oprefetch,
                uprefetch,
            )
        )

    @decorators.action(detail=False, methods=["get"], url_path="progress/me")
    def my_progress(self, request):
        """
        Devuelve las unidades con niveles/objetivos y el progreso del usuario (prefetch ya aplicado).
        """
        ser = self.get_serializer(self.get_queryset(), many=True, context={"request": request})
        return response.Response(ser.data)


# =========================
# LevelViewSet
# =========================
class LevelViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Detalle/listado de niveles y acciones para resetear/completar progreso.
    """
    serializer_class = LevelSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "slug"
    lookup_value_regex = r"[^/]+"

    def get_queryset(self):
        user = self.request.user
        # Objective NO tiene is_active ni order
        objectives_qs = Objective.objects.all().order_by("code")
        return (
            Level.objects.filter(is_active=True)
            .order_by("order")
            .prefetch_related(
                Prefetch("objectives", queryset=objectives_qs),
                Prefetch("objectives__objectiveprogress_set", queryset=ObjectiveProgress.objects.filter(user=user)),
                Prefetch("userprogress_set", queryset=UserProgress.objects.filter(user=user)),
            )
        )

    @decorators.action(detail=False, methods=["get"], url_path="progress/me")
    def my_progress(self, request):
        """
        Endpoint esperado por el frontend: /api/levels/progress/me/
        Devuelve niveles (con objetivos) incluyendo el progreso del usuario.
        """
        qs = self.get_queryset()
        ser = self.get_serializer(qs, many=True, context={"request": request})
        return response.Response(ser.data)

    @decorators.action(detail=True, methods=["post"], url_path="reset")
    def reset(self, request, slug=None):
        """
        Resetea el progreso del usuario en el nivel y actualiza la unidad si corresponde.
        """
        level = self.get_object()

        # Borrar progreso de objetivos del usuario en este level
        ObjectiveProgress.objects.filter(user=request.user, objective__level=level).delete()

        # Resetear progreso de nivel
        up, _ = UserProgress.objects.get_or_create(user=request.user, level=level)
        up.completed = False
        up.completed_at = None
        up.score = 0
        up.save()

        # Actualizar UnitProgress si el nivel pertenece a una unidad
        if level.unit_id:
            levels = level.unit.levels.filter(is_active=True)
            uprog, _ = UnitProgress.objects.get_or_create(user=request.user, unit=level.unit)
            uprog.score = (
                UserProgress.objects
                .filter(user=request.user, level__in=levels)
                .aggregate(Sum("score"))["score__sum"] or 0
            )
            all_completed = (
                UserProgress.objects
                .filter(user=request.user, level__in=levels, completed=True)
                .count() == levels.count()
            )
            if not all_completed:
                uprog.completed = False
                uprog.completed_at = None
            uprog.save()

        return response.Response({"ok": True, "level_reset": True}, status=status.HTTP_200_OK)

    @decorators.action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, slug=None):
        """
        Marca el nivel como completado para el usuario, recalcula score y actualiza UnitProgress.
        """
        level = self.get_object()
        up, _ = UserProgress.objects.get_or_create(user=request.user, level=level)

        total = (
            ObjectiveProgress.objects
            .filter(user=request.user, objective__level=level, achieved=True)
            .aggregate(Sum("objective__points"))["objective__points__sum"] or 0
        )

        if not up.completed:
            up.completed = True
            up.completed_at = timezone.now()
        up.score = total
        up.save()

        # Actualizar UnitProgress si el nivel pertenece a una unidad
        if level.unit_id:
            levels = level.unit.levels.filter(is_active=True)
            uprog, _ = UnitProgress.objects.get_or_create(user=request.user, unit=level.unit)
            uprog.score = (
                UserProgress.objects
                .filter(user=request.user, level__in=levels)
                .aggregate(Sum("score"))["score__sum"] or 0
            )

            all_completed = (
                UserProgress.objects
                .filter(user=request.user, level__in=levels, completed=True)
                .count() == levels.count()
            )
            if all_completed:
                if not uprog.completed:
                    uprog.completed = True
                    uprog.completed_at = timezone.now()
            else:
                uprog.completed = False
                uprog.completed_at = None
            uprog.save()

        return response.Response({"ok": True, "level_completed": True, "score": up.score}, status=status.HTTP_200_OK)


# =========================
# Registro de estudiantes
# =========================
class StudentRegistrationView(generics.CreateAPIView):
    serializer_class = StudentRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        payload = {
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
        }
        return response.Response(payload, status=status.HTTP_201_CREATED)


# =========================
# Endpoint: hit_objective
# =========================
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def hit_objective(request, code):
    """
    Marca un objetivo como logrado y recalcula el score del nivel para el usuario.
    """
    try:
        obj = Objective.objects.get(code=code)
    except Objective.DoesNotExist:
        return response.Response({"detail": "Objective not found"}, status=status.HTTP_404_NOT_FOUND)

    op, _ = ObjectiveProgress.objects.get_or_create(user=request.user, objective=obj)
    if not op.achieved:
        op.achieved = True
        op.achieved_at = timezone.now()
        op.save()

    up, _ = UserProgress.objects.get_or_create(user=request.user, level=obj.level)
    up.score = (
        ObjectiveProgress.objects
        .filter(user=request.user, objective__level=obj.level, achieved=True)
        .aggregate(Sum("objective__points"))["objective__points__sum"] or 0
    )
    up.save()

    return response.Response({"ok": True, "score": up.score}, status=status.HTTP_200_OK)
