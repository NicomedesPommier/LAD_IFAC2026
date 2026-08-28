# apps/learning/models.py
from django.conf import settings
from django.db import models

class Unit(models.Model):
    slug = models.SlugField(primary_key=True)
    title = models.CharField(max_length=120)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

class Level(models.Model):
    slug = models.SlugField(primary_key=True)
    unit = models.ForeignKey(Unit, null=True, blank=True, related_name="levels", on_delete=models.SET_NULL)
    title = models.CharField(max_length=120)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        # opcional, asegura orden único por unidad
        constraints = [
            models.UniqueConstraint(fields=["unit", "order"], name="unique_level_order_per_unit")
        ]

    def __str__(self):
        return self.title

class Objective(models.Model):
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name="objectives")
    code = models.CharField(max_length=64, unique=True)
    description = models.CharField(max_length=200)
    points = models.IntegerField(default=10)
    def __str__(self): return self.code

class UserProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(default=0)
    class Meta: unique_together = ("user", "level")

class ObjectiveProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    objective = models.ForeignKey(Objective, on_delete=models.CASCADE)
    achieved = models.BooleanField(default=False)
    achieved_at = models.DateTimeField(null=True, blank=True)
    class Meta: unique_together = ("user", "objective")

# NEW: optional aggregated progress per unit
class UnitProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(default=0)  # sum of levels in unit
    class Meta: unique_together = ("user", "unit")
