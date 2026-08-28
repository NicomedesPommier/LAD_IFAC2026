#!/usr/bin/env python3
"""Django REST API load test.

Fires `C` concurrent closed-loop workers at an endpoint for `duration` seconds,
each authenticating as a DISTINCT user (rotating through the token file) so the
per-user DRF throttle isn't what's measured. Reports throughput and latency
percentiles plus a status-code breakdown (200 vs 429-throttled vs errors).

Generate the token file first (see deploy/loadtest/gen_tokens.py):
    cd LAD/lad && ../.venv/bin/python manage.py shell < ../../deploy/loadtest/gen_tokens.py

Usage:
    python3 api_load.py [concurrency] [duration_s] [base_url] [tokens_file]
    e.g.  for C in 5 15 30 60; do python3 api_load.py $C 8 http://127.0.0.1:8001; done
"""
import asyncio, os, sys, time, statistics
import aiohttp

C        = int(sys.argv[1]) if len(sys.argv) > 1 else 10
DURATION = float(sys.argv[2]) if len(sys.argv) > 2 else 8
BASE     = sys.argv[3] if len(sys.argv) > 3 else "http://127.0.0.1:8001"
TOKFILE  = sys.argv[4] if len(sys.argv) > 4 else os.path.join(os.path.expanduser("~"), ".cache", "lad-loadtest", "tokens.txt")
URL      = BASE.rstrip("/") + "/api/units/"   # heaviest read endpoint (curriculum tree)
TOKENS   = [t.strip() for t in open(TOKFILE).read().splitlines() if t.strip()]

lat, status, errors = [], {}, 0


async def worker(idx, session, stop):
    global errors
    headers = {"Authorization": f"Bearer {TOKENS[idx % len(TOKENS)]}"}
    while time.monotonic() < stop:
        t0 = time.monotonic()
        try:
            async with session.get(URL, headers=headers) as r:
                await r.read()
                lat.append((time.monotonic() - t0) * 1000.0)
                status[r.status] = status.get(r.status, 0) + 1
        except Exception:
            errors += 1


async def main():
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30),
                                     connector=aiohttp.TCPConnector(limit=0)) as session:
        stop = time.monotonic() + DURATION
        t0 = time.monotonic()
        await asyncio.gather(*[worker(i, session, stop) for i in range(C)])
        wall = time.monotonic() - t0
    n = len(lat)
    p = lambda q: (statistics.quantiles(lat, n=100)[q - 1] if n > 2 else (lat[0] if lat else 0))
    other = {k: v for k, v in status.items() if k not in (200, 429)}
    print(f"C={C:>3} | req={n:>6} ok200={status.get(200,0):>6} 429={status.get(429,0):>5} other={other} err={errors} "
          f"| {n / wall:6.0f} req/s | lat ms p50={p(50):7.1f} p95={p(95):7.1f} p99={p(99):7.1f}")


asyncio.run(main())
