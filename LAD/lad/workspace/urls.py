from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from .views import (
    CanvasViewSet,
    WorkspaceFileViewSet,
    MeshViewSet,
    execute_command,
    serve_mesh,
    start_streaming_command,
    get_process_output,
    kill_process
)

# Main router for canvases
router = DefaultRouter()
router.register(r'canvases', CanvasViewSet, basename='canvas')

# Nested router for files within a canvas
canvases_router = routers.NestedDefaultRouter(router, r'canvases', lookup='canvas')
canvases_router.register(r'files', WorkspaceFileViewSet, basename='canvas-files')
canvases_router.register(r'meshes', MeshViewSet, basename='canvas-meshes')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(canvases_router.urls)),
    path('canvases/<uuid:canvas_id>/execute/', execute_command, name='execute-command'),
    path('canvases/<uuid:canvas_id>/execute-streaming/', start_streaming_command, name='start-streaming-command'),
    path('canvases/<uuid:canvas_id>/process/<str:process_id>/output/', get_process_output, name='get-process-output'),
    path('canvases/<uuid:canvas_id>/process/<str:process_id>/kill/', kill_process, name='kill-process'),
    path('workspace_<uuid:canvas_id>/meshes/<str:filename>', serve_mesh, name='serve-mesh'),
]
