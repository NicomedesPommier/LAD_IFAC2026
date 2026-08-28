from django.db import models
from django.contrib.auth.models import User
import uuid


class Canvas(models.Model):
    """
    Represents a user's workspace/canvas where they build ROS projects
    Each canvas has a unique ID and is stored in Docker at /workspaces/<username>/<canvas_id>/
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="canvases")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    connect_to_qcar = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Canvas"
        verbose_name_plural = "Canvases"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user.username}/{self.name} ({self.id})"

    @property
    def docker_path(self):
        """Returns the Docker path for this canvas"""
        return f"/workspaces/{self.user.username}/{self.id}"


class WorkspaceFile(models.Model):
    """
    Represents a file or directory within a canvas workspace
    Mirrors the file structure in Docker
    """
    FILE = "file"
    DIRECTORY = "directory"
    TYPE_CHOICES = [
        (FILE, "File"),
        (DIRECTORY, "Directory"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    canvas = models.ForeignKey(Canvas, on_delete=models.CASCADE, related_name="files")
    path = models.CharField(max_length=512, help_text="Relative path from canvas root (e.g., 'src/my_robot/urdf/robot.urdf')")
    file_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=FILE)
    content = models.TextField(blank=True, help_text="File content (empty for directories)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["canvas", "path"]
        ordering = ["path"]

    def __str__(self):
        return f"{self.canvas.user.username}/{self.canvas.id}/{self.path}"

    @property
    def full_docker_path(self):
        """Returns the full Docker path for this file"""
        return f"{self.canvas.docker_path}/{self.path}"

    @property
    def name(self):
        """Returns the file/directory name"""
        return self.path.split("/")[-1] if "/" in self.path else self.path


class CustomMesh(models.Model):
    """
    Custom mesh files uploaded by users for their URDF robots
    Supports STL, DAE, and OBJ file formats
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    canvas = models.ForeignKey(
        Canvas,
        on_delete=models.CASCADE,
        related_name='custom_meshes'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='custom_meshes'
    )
    name = models.CharField(
        max_length=255,
        help_text="Display name for the mesh"
    )
    file = models.FileField(
        upload_to='meshes/%Y/%m/%d/',
        help_text="The actual mesh file (STL, DAE, OBJ)"
    )
    file_size = models.IntegerField(
        help_text="File size in bytes"
    )
    file_type = models.CharField(
        max_length=10,
        help_text="File extension (.stl, .dae, .obj)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['canvas', 'name']
        verbose_name = "Custom Mesh"
        verbose_name_plural = "Custom Meshes"

    def __str__(self):
        return f"{self.name} ({self.canvas.name})"

    @property
    def file_path(self):
        """
        Returns the package:// style path for URDF
        Format: package://workspace_{canvas_id}/meshes/{filename}
        """
        import os
        filename = os.path.basename(self.file.name)
        return f"package://workspace_{self.canvas.id}/meshes/{filename}"
