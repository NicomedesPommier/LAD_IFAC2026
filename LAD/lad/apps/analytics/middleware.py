import queue
import threading
import time

from django.conf import settings
from django.db import connection

from .models import Event
from .views import _client_ip


# ── Background writer ────────────────────────────────────────────────────────
# The per-request metrics INSERT used to run synchronously on the response path,
# taking the SQLite write lock inline with every /api/ request. It now goes onto
# an in-process queue drained by a single daemon thread that bulk_creates in
# batches, so the request returns without waiting on the write. Fire-and-forget:
# under a burst we drop rather than block, and buffered rows are lost on process
# exit (acceptable for analytics).
_EVENT_QUEUE_MAX = 5000
_EVENT_BATCH_MAX = 200
_event_queue = queue.Queue(maxsize=_EVENT_QUEUE_MAX)
_worker_started = False
_worker_lock = threading.Lock()


def _event_worker():
    while True:
        item = _event_queue.get()
        if item is None:
            return
        batch = [item]
        try:
            while len(batch) < _EVENT_BATCH_MAX:
                batch.append(_event_queue.get_nowait())
        except queue.Empty:
            pass
        try:
            Event.objects.bulk_create(
                [Event(**data) for data in batch], ignore_conflicts=True
            )
        except Exception:
            pass
        finally:
            # Don't keep an idle SQLite connection open in this worker thread.
            try:
                connection.close()
            except Exception:
                pass


def _ensure_worker():
    global _worker_started
    if _worker_started:
        return
    with _worker_lock:
        if _worker_started:
            return
        threading.Thread(
            target=_event_worker, name="analytics-event-writer", daemon=True
        ).start()
        _worker_started = True


def _enqueue_event(data):
    _ensure_worker()
    try:
        _event_queue.put_nowait(data)
    except queue.Full:
        pass  # drop under burst instead of blocking the request


class RequestMetricsMiddleware:
    """Logs one `http_request` Event per /api/ request (latency + status code).

    Fire-and-forget and OFF the request path: the row is enqueued and written by
    a background thread, so request handling never waits on the DB. Excludes
    /api/analytics/* to avoid self-amplification. Set
    ANALYTICS_REQUEST_METRICS=False to disable entirely.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        t0 = time.monotonic()
        response = self.get_response(request)
        try:
            if not getattr(settings, "ANALYTICS_REQUEST_METRICS", True):
                return response
            path = request.path
            if path.startswith("/api/") and not path.startswith("/api/analytics/"):
                user = getattr(request, "user", None)
                user = user if (user and user.is_authenticated) else None
                _enqueue_event(dict(
                    user=user,
                    source=Event.Source.SERVER,
                    event_type="http_request",
                    target=path[:200],
                    value=getattr(response, "status_code", None),
                    duration_ms=int((time.monotonic() - t0) * 1000),
                    metadata={"method": request.method},
                    ip=_client_ip(request),
                ))
        except Exception:
            pass
        return response
