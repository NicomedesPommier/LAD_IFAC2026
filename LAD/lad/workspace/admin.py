from django.contrib import admin
from .models import Canvas, WorkspaceFile


@admin.register(Canvas)
class CanvasAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "id", "created_at", "updated_at", "is_active"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "user__username", "id"]
    readonly_fields = ["id", "created_at", "updated_at", "docker_path"]


@admin.register(WorkspaceFile)
class WorkspaceFileAdmin(admin.ModelAdmin):
    list_display = ["path", "canvas", "file_type", "created_at", "updated_at"]
    list_filter = ["file_type", "created_at"]
    search_fields = ["path", "canvas__name", "canvas__user__username"]
    readonly_fields = ["id", "created_at", "updated_at", "full_docker_path", "name"]
