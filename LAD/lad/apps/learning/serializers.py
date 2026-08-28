# apps/learning/serializers.py
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers

from .models import Unit, Level, Objective, UserProgress, ObjectiveProgress

User = get_user_model()


# Opcional: por si necesitas exponer progreso de objetivos de forma aislada
class ObjectiveProgressSerializer(serializers.Serializer):
    achieved = serializers.BooleanField()
    achieved_at = serializers.DateTimeField(allow_null=True)


class ObjectiveSerializer(serializers.ModelSerializer):
    description = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = Objective
        fields = ("code", "description", "points", "user_progress")

    def get_description(self, obj):
        # Tolerante a distintos nombres de campo/prop.
        return getattr(obj, "description", None) or getattr(obj, "Description", "") or ""

    def get_user_progress(self, obj):
        """
        Intenta primero usar prefetch:
          - to_attr personalizado: obj._user_obj_prog (lista)
          - manager prefetcheado: obj.objectiveprogress_set.all()
        Si no hay, hace fallback a una query única.
        """
        # 1) to_attr personalizado (si tu queryset lo usa)
        if hasattr(obj, "_user_obj_prog") and obj._user_obj_prog:
            op = obj._user_obj_prog[0]
            return {"achieved": op.achieved, "achieved_at": op.achieved_at}

        # 2) manager prefetcheado (prefetch_related sobre objectiveprogress_set)
        op_manager = getattr(obj, "objectiveprogress_set", None)
        if op_manager is not None:
            try:
                op = next(iter(op_manager.all()))  # usa cache si fue prefetcheado
                return {"achieved": op.achieved, "achieved_at": op.achieved_at}
            except StopIteration:
                return {"achieved": False, "achieved_at": None}

        # 3) fallback a query directa (solo si hay usuario autenticado)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return {"achieved": False, "achieved_at": None}

        try:
            op = ObjectiveProgress.objects.get(user=user, objective=obj)
            return {"achieved": op.achieved, "achieved_at": op.achieved_at}
        except ObjectiveProgress.DoesNotExist:
            return {"achieved": False, "achieved_at": None}


class LevelSerializer(serializers.ModelSerializer):
    objectives = ObjectiveSerializer(many=True, read_only=True)
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = Level
        fields = ("slug", "title", "order", "is_active", "objectives", "user_progress")

    def get_user_progress(self, obj):
        """
        Usa prefetch si existe:
          - to_attr personalizado: obj._user_level_prog (lista)
          - manager prefetcheado: obj.userprogress_set.all()
        Fallback a query directa si no hay prefetch y el usuario está autenticado.
        """
        # 1) to_attr personalizado
        if hasattr(obj, "_user_level_prog") and obj._user_level_prog:
            up = obj._user_level_prog[0]
            return {"completed": up.completed, "completed_at": up.completed_at, "score": up.score}

        # 2) manager prefetcheado
        up_manager = getattr(obj, "userprogress_set", None)
        if up_manager is not None:
            try:
                up = next(iter(up_manager.all()))
                return {"completed": up.completed, "completed_at": up.completed_at, "score": up.score}
            except StopIteration:
                return {"completed": False, "completed_at": None, "score": 0}

        # 3) fallback
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return {"completed": False, "completed_at": None, "score": 0}

        try:
            up = UserProgress.objects.get(user=user, level=obj)
            return {"completed": up.completed, "completed_at": up.completed_at, "score": up.score}
        except UserProgress.DoesNotExist:
            return {"completed": False, "completed_at": None, "score": 0}


class UnitSerializer(serializers.ModelSerializer):
    levels = LevelSerializer(many=True, read_only=True)
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = ("slug", "title", "order", "is_active", "levels", "user_progress")

    def get_user_progress(self, obj):
        """
        Intenta leer UnitProgress; si no existe, intenta derivar de los niveles
        (cuando fueron prefetcheados con el progreso del usuario).
        """
        from .models import UnitProgress

        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return {"completed": False, "completed_at": None, "score": 0}

        try:
            up = UnitProgress.objects.get(user=user, unit=obj)
            return {"completed": up.completed, "completed_at": up.completed_at, "score": up.score}
        except UnitProgress.DoesNotExist:
            # Derivar: completado si todos los niveles tienen completed=True
            levels = list(getattr(obj, "levels", []).all()) if hasattr(obj, "levels") else []
            if not levels:
                return {"completed": False, "completed_at": None, "score": 0}

            def level_completed(lv):
                # to_attr o manager prefetcheado
                if hasattr(lv, "_user_level_prog") and lv._user_level_prog:
                    return bool(lv._user_level_prog[0].completed)
                up_manager = getattr(lv, "userprogress_set", None)
                if up_manager is not None:
                    try:
                        up_lv = next(iter(up_manager.all()))
                        return bool(up_lv.completed)
                    except StopIteration:
                        return False
                # si no hay datos, asumimos no completado
                return False

            completed = all(level_completed(lv) for lv in levels)
            return {"completed": completed, "completed_at": None, "score": 0}
        except Exception:
            # fallback seguro ante cualquier inconsistencia
            return {"completed": False, "completed_at": None, "score": 0}


class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    invite_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("username", "password", "invite_code", "first_name", "last_name", "email")
        extra_kwargs = {
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
            "email": {"required": False, "allow_blank": True},
        }

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            # Devolver lista de mensajes que DRF formatea bien
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate(self, attrs):
        # Invite-code gate: enforced only when REGISTRATION_INVITE_CODE is set
        # (public/tunnel beta). Empty setting = open registration (LAN dev default).
        required_code = settings.REGISTRATION_INVITE_CODE
        if required_code:
            supplied = (attrs.get("invite_code") or "").strip()
            if not supplied or not secrets.compare_digest(supplied, required_code):
                raise serializers.ValidationError(
                    {"invite_code": "A valid invite code is required to register."}
                )
        return attrs

    def create(self, validated_data):
        validated_data.pop("invite_code", None)
        password = validated_data.pop("password")
        # create_user maneja normalización y flags por defecto (no staff/superuser).
        user = User.objects.create_user(password=password, **validated_data)
        # Forzar explícitamente por si el manager fue personalizado:
        if getattr(user, "is_staff", None) is not False:
            user.is_staff = False
        if getattr(user, "is_superuser", None) is not False:
            user.is_superuser = False
        # Asegúrate de que el password esté seteado (create_user ya lo hace)
        # y persiste cambios de flags en caso de haber sido tocados.
        user.save(update_fields=["is_staff", "is_superuser"])
        return user

