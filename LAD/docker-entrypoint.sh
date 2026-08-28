#!/bin/bash
set -e

echo "=== L.A.D. Backend Startup ==="

# Wait for database if using PostgreSQL
if [ -n "$DATABASE_URL" ] || [ -n "$POSTGRES_HOST" ]; then
    echo "Waiting for database..."
    while ! python -c "import socket; socket.create_connection(('${POSTGRES_HOST:-db}', ${POSTGRES_PORT:-5432}), timeout=1)" 2>/dev/null; do
        echo "Database not ready, waiting..."
        sleep 2
    done
    echo "Database is ready!"
fi

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Load initial data if database is empty
# Use FIXTURE_FILE env var to customize, defaults to curriculum_data.json
FIXTURE_FILE="${FIXTURE_FILE:-fixtures/curriculum_data.json}"
echo "Checking for initial data..."
python manage.py shell -c "
from django.contrib.auth.models import User
from apps.learning.models import Unit
if not Unit.objects.exists():
    print('Loading initial fixtures...')
    import subprocess
    subprocess.run(['python', 'manage.py', 'loaddata', '${FIXTURE_FILE}'], check=False)
else:
    print('Data already exists, skipping fixtures.')
"

echo "=== Starting application ==="
exec "$@"
