# Create N throwaway load-test users and write their JWT access tokens to a file.
#
# Safety:
#   - refuses to run unless settings.DEBUG or LOADTEST_OK=1 (don't create users in prod)
#   - only ever touches users it created itself (marked first_name="loadtest"); it
#     will abort rather than reset the password of a real account named "loadN"
#   - sets a random throwaway password per run (never a committed literal); the JWT
#     is the only credential the load test uses, so no usable account password exists
#   - writes the token file 0600 (the tokens are bearer credentials) under ~/.cache
#
# Run from LAD/lad (Django shell sets up the environment):
#   LOADTEST_OK=1 ../.venv/bin/python manage.py shell < ../../deploy/loadtest/gen_tokens.py
#
# Clean up afterwards (deletes only the marked load-test users):
#   LOADTEST_CLEANUP=1 ../.venv/bin/python manage.py shell < ../../deploy/loadtest/gen_tokens.py
#
# Env: LOADTEST_USERS (default 20), LOADTEST_TOKENS (default ~/.cache/lad-loadtest/tokens.txt)
import os
import secrets
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

PREFIX = "load"
MARKER = "loadtest"   # first_name marker — we only ever touch users we created
User = get_user_model()

if not (settings.DEBUG or os.environ.get("LOADTEST_OK") == "1"):
    raise SystemExit("refusing to run: set LOADTEST_OK=1 (or DEBUG=true) to create load-test users")

if os.environ.get("LOADTEST_CLEANUP") == "1":
    n, _ = User.objects.filter(username__startswith=PREFIX, first_name=MARKER).delete()
    print(f"cleaned up {n} load-test users")
    raise SystemExit(0)

N = int(os.environ.get("LOADTEST_USERS", "20"))
OUT = os.environ.get("LOADTEST_TOKENS") or os.path.join(
    os.path.expanduser("~"), ".cache", "lad-loadtest", "tokens.txt")

tokens = []
for i in range(N):
    username = f"{PREFIX}{i}"
    u = User.objects.filter(username=username).first()
    if u and u.first_name != MARKER:
        raise SystemExit(f"refusing: user {username!r} exists and was not created by this script")
    if u is None:
        u = User(username=username)
    u.set_password(secrets.token_urlsafe(32))   # random throwaway; discarded after minting the JWT
    u.first_name = MARKER
    u.is_staff = False
    u.is_superuser = False
    u.save()
    tokens.append(str(AccessToken.for_user(u)))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
fd = os.open(OUT, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
os.write(fd, ("\n".join(tokens)).encode())
os.close(fd)
print(f"wrote {len(tokens)} tokens to {OUT} (mode 0600)")
