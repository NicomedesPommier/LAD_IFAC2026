from django.urls import path

from . import views

urlpatterns = [
    path("events/", views.ingest_events, name="analytics-events"),
    path("heartbeat/", views.heartbeat, name="analytics-heartbeat"),
    path("summary/", views.summary, name="analytics-summary"),
    path("users/", views.per_user, name="analytics-users"),
]
