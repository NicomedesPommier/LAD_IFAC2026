from datetime import timedelta

from django.db.models import Avg, Count, Max, Min, Sum
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from .models import Event, Presence


def _client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _auth_user(request):
    user = getattr(request, "user", None)
    return user if (user and user.is_authenticated) else None


def _safe_int(v):
    try:
        return int(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def _safe_float(v):
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


@api_view(["POST"])
@permission_classes([AllowAny])
def ingest_events(request):
    """Accept a batch of client events. Never raises — analytics must not break
    the app. Body: {events: [{event_type, ts?, session_id?, target?, duration_ms?,
    value?, metadata?}, ...]}.
    """
    payload = request.data or {}
    events = payload.get("events") or []
    user = _auth_user(request)
    ip = _client_ip(request)

    created = 0
    for e in events:
        if not isinstance(e, dict):
            continue
        event_type = (e.get("event_type") or "").strip()
        if not event_type:
            continue
        ts = parse_datetime(e["ts"]) if e.get("ts") else None
        meta = e.get("metadata")
        try:
            Event.objects.create(
                created_at=ts or timezone.now(),
                user=user,
                session_id=str(e.get("session_id") or "")[:64],
                source=Event.Source.CLIENT,
                event_type=event_type[:64],
                target=str(e.get("target") or "")[:200],
                duration_ms=_safe_int(e.get("duration_ms")),
                value=_safe_float(e.get("value")),
                metadata=meta if isinstance(meta, dict) else {},
                ip=ip,
            )
            created += 1
        except Exception:
            pass

    return Response({"created": created})


@api_view(["POST"])
@permission_classes([AllowAny])
def heartbeat(request):
    """Upsert presence for the authenticated user and report the live count."""
    now = timezone.now()
    user = _auth_user(request)
    data = request.data or {}

    if user:
        try:
            Presence.objects.update_or_create(
                user=user,
                defaults={
                    "last_seen": now,
                    "last_path": str(data.get("path") or "")[:200],
                    "session_id": str(data.get("session_id") or "")[:64],
                },
            )
        except Exception:
            pass

    online = Presence.objects.filter(last_seen__gte=now - timedelta(minutes=5)).count()
    return Response({"online": online})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def summary(request):
    """Admin-only aggregate view. ?from=YYYY-MM-DD&to=YYYY-MM-DD (default 14 days)."""
    to_date = parse_date(request.query_params.get("to", "")) or timezone.now().date()
    from_date = parse_date(request.query_params.get("from", "")) or (to_date - timedelta(days=14))

    qs = Event.objects.filter(date__gte=from_date, date__lte=to_date)
    now = timezone.now()

    # Per-day event counts
    by_day = list(
        qs.values("date", "event_type")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    # Beta mission timing (paired complete events carry duration_ms + points)
    beta = list(
        qs.filter(event_type="beta_mission_complete")
        .values("target")
        .annotate(
            completions=Count("id"),
            avg_ms=Avg("duration_ms"),
            min_ms=Min("duration_ms"),
            max_ms=Max("duration_ms"),
        )
        .order_by("target")
    )
    beta_starts = dict(
        qs.filter(event_type="beta_mission_start")
        .values_list("target")
        .annotate(c=Count("id"))
    )
    for row in beta:
        row["starts"] = beta_starts.get(row["target"], 0)

    return Response({
        "from": str(from_date),
        "to": str(to_date),
        "online_now": Presence.objects.filter(last_seen__gte=now - timedelta(minutes=5)).count(),
        "total_events": qs.count(),
        "by_day": by_day,
        "beta_missions": beta,
    })


@api_view(["GET"])
@permission_classes([IsAdminUser])
def per_user(request):
    """Admin-only per-user breakdown: how much time each user spent on each beta
    mission, plus activity. ?from=YYYY-MM-DD&to=YYYY-MM-DD (default 14 days).
    """
    to_date = parse_date(request.query_params.get("to", "")) or timezone.now().date()
    from_date = parse_date(request.query_params.get("from", "")) or (to_date - timedelta(days=14))

    qs = Event.objects.filter(date__gte=from_date, date__lte=to_date).exclude(user__isnull=True)
    now = timezone.now()

    # Beta completions grouped by user (count + total time on missions).
    comp_map = {
        r["user_id"]: r
        for r in qs.filter(event_type="beta_mission_complete")
        .values("user_id")
        .annotate(missions=Count("id"), total_ms=Sum("duration_ms"))
    }

    # Per-mission time for each user (avg duration if a mission was repeated).
    pm_map = {}
    for r in (qs.filter(event_type="beta_mission_complete")
              .values("user_id", "target")
              .annotate(ms=Avg("duration_ms"), n=Count("id"))):
        pm_map.setdefault(r["user_id"], {})[r["target"]] = {
            "ms": int(r["ms"]) if r["ms"] is not None else None,
            "n": r["n"],
        }

    # Online-now lookup from presence.
    online_cutoff = now - timedelta(minutes=5)
    online_ids = set(
        Presence.objects.filter(last_seen__gte=online_cutoff).values_list("user_id", flat=True)
    )

    # All users with any activity in range → attach beta stats.
    users = []
    for r in (qs.values("user_id", "user__username")
              .annotate(events=Count("id"), last=Max("created_at"))):
        uid = r["user_id"]
        c = comp_map.get(uid, {})
        users.append({
            "user_id": uid,
            "username": r["user__username"] or f"user_{uid}",
            "events": r["events"],
            "last_active": r["last"],
            "online": uid in online_ids,
            "missions_completed": c.get("missions", 0),
            "total_mission_ms": c.get("total_ms") or 0,
            "missions": pm_map.get(uid, {}),
        })

    users.sort(key=lambda u: (u["missions_completed"], u["total_mission_ms"]), reverse=True)

    return Response({
        "from": str(from_date),
        "to": str(to_date),
        "users": users,
    })
