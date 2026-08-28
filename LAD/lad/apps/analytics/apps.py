from django.apps import AppConfig
from django.db.backends.signals import connection_created


def _enable_sqlite_wal(sender, connection, **kwargs):
    """Enable WAL on every new SQLite connection.

    WAL lets readers proceed during a write and sharply reduces "database is
    locked" contention for this read-heavy, many-small-writes workload
    (per-request metrics, heartbeats, progress). synchronous=NORMAL is the
    safe/fast pairing for WAL. No-op on non-sqlite backends.
    """
    if connection.vendor != "sqlite":
        return
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")


class AnalyticsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.analytics"

    def ready(self):
        # Connect the WAL pragma here (analytics is the write-heaviest app, but
        # this applies to the whole default SQLite connection).
        connection_created.connect(_enable_sqlite_wal)
