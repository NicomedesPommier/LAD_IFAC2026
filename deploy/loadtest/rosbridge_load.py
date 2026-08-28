#!/usr/bin/env python3
"""rosbridge relay load test.

Opens N concurrent WebSocket clients to rosbridge. Each client advertises and
subscribes to its OWN namespaced topic (so there's no cross-client fan-out — it
mirrors how each browser sim drives its own QCar) and publishes a laserscan-sized
message (~360 floats) at `rate` Hz, measuring publish->echo round-trip latency.

Usage:
    python3 rosbridge_load.py [N] [duration_s] [rate_hz] [ws_host]
    e.g.  for N in 10 25 50 100; do python3 rosbridge_load.py $N 12 10; done

Watch the container CPU alongside it:
    docker stats --no-stream qcar_docker-ros-1
"""
import asyncio, json, sys, time, statistics
import websockets

N        = int(sys.argv[1]) if len(sys.argv) > 1 else 20
DURATION = float(sys.argv[2]) if len(sys.argv) > 2 else 12
RATE     = float(sys.argv[3]) if len(sys.argv) > 3 else 10        # Hz per client
HOST     = sys.argv[4] if len(sys.argv) > 4 else "127.0.0.1:9090"
URI      = f"ws://{HOST}"
PAYLOAD  = 360  # floats per msg (~laserscan-sized)

rtts, sent, recv, connected, errors = [], 0, 0, 0, 0


async def client(i):
    global sent, recv, connected, errors
    topic = f"/load_{i}/scan"
    send_times = {}
    try:
        async with websockets.connect(URI, max_size=None, open_timeout=15, ping_interval=None) as ws:
            connected += 1
            await ws.send(json.dumps({"op": "advertise", "topic": topic, "type": "std_msgs/Float32MultiArray"}))
            await ws.send(json.dumps({"op": "subscribe", "topic": topic, "type": "std_msgs/Float32MultiArray"}))
            stop = time.monotonic() + DURATION

            async def receiver():
                global recv
                while time.monotonic() < stop + 2:
                    try:
                        raw = await asyncio.wait_for(ws.recv(), timeout=1)
                    except asyncio.TimeoutError:
                        if time.monotonic() >= stop + 1.5:
                            return
                        continue
                    except Exception:
                        return
                    m = json.loads(raw)
                    if m.get("op") == "publish":
                        data = m.get("msg", {}).get("data") or []
                        if data:
                            t0 = send_times.pop(int(data[0]), None)
                            if t0 is not None:
                                rtts.append((time.monotonic() - t0) * 1000.0)
                                recv += 1

            async def publisher():
                global sent
                seq, period = 0, 1.0 / RATE
                while time.monotonic() < stop:
                    seq += 1
                    send_times[seq] = time.monotonic()
                    try:
                        await ws.send(json.dumps({"op": "publish", "topic": topic,
                                                  "msg": {"data": [float(seq)] + [0.0] * (PAYLOAD - 1)}}))
                        sent += 1
                    except Exception:
                        return
                    await asyncio.sleep(period)

            await asyncio.gather(receiver(), publisher())
    except Exception:
        errors += 1


async def main():
    t0 = time.monotonic()
    await asyncio.gather(*[client(i) for i in range(N)])
    wall = time.monotonic() - t0
    p = lambda q: (statistics.quantiles(rtts, n=100)[q - 1] if len(rtts) > 2 else (rtts[0] if rtts else 0))
    print(f"N={N:>3} | connected={connected:>3}/{N} err={errors} | sent={sent:>6} recv={recv:>6} "
          f"deliver={100.0 * recv / max(sent, 1):5.1f}% | RTT ms p50={p(50):7.1f} p95={p(95):7.1f} "
          f"p99={p(99):7.1f} | thru={sent / wall:6.0f} msg/s")


asyncio.run(main())
