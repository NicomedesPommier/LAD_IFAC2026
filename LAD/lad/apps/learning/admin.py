# apps/learning/admin.py
from django.contrib import admin
from .models import Unit, Level, Objective, UserProgress, ObjectiveProgress, UnitProgress

class LevelInline(admin.TabularInline):
    model = Level
    extra = 0
    fields = ("slug", "title", "order", "is_active")
    show_change_link = True

class ObjectiveInline(admin.TabularInline):
    model = Objective
    extra = 0
    fields = ("code", "description", "points")
    show_change_link = True

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("slug", "title", "order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("slug", "title")
    ordering = ("order", "slug")
    inlines = [LevelInline]

@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ("slug", "title", "unit", "order", "is_active")
    list_filter = ("is_active", "unit")
    search_fields = ("slug", "title", "unit__title", "unit__slug")
    ordering = ("unit__order", "order", "slug")
    inlines = [ObjectiveInline]

@admin.register(Objective)
class ObjectiveAdmin(admin.ModelAdmin):
    list_display = ("code", "level", "points")
    list_filter = ("level",)
    search_fields = ("code", "description", "level__slug", "level__title")
    ordering = ("level__unit__order", "level__order", "code")

# ✅ add these so you can see progress rows in admin
@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "level", "completed", "score", "completed_at")
    list_filter = ("completed", "level__unit", "level")
    search_fields = ("user__username", "level__slug", "level__title")
    ordering = ("-completed", "-completed_at")

@admin.register(ObjectiveProgress)
class ObjectiveProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "objective", "achieved", "achieved_at")
    list_filter = ("achieved", "objective__level__unit", "objective__level")
    search_fields = ("user__username", "objective__code")
    ordering = ("-achieved", "-achieved_at")

@admin.register(UnitProgress)
class UnitProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "unit", "completed", "score", "completed_at")
    list_filter = ("completed", "unit")
    search_fields = ("user__username", "unit__slug", "unit__title")
    ordering = ("-completed", "-completed_at")
