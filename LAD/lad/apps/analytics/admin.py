from django.contrib import admin

from .models import Event, Presence


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("date", "created_at", "event_type", "source", "user", "target", "duration_ms", "value")
    list_filter = ("date", "event_type", "source")
    date_hierarchy = "created_at"
    search_fields = ("target", "user__username", "session_id", "event_type")
    readonly_fields = ("created_at", "date", "user", "session_id", "source",
                       "event_type", "target", "duration_ms", "value", "metadata", "ip")
    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False


@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    list_display = ("user", "last_seen", "last_path", "active_ws", "session_id")
    search_fields = ("user__username", "last_path")
    ordering = ("-last_seen",)
