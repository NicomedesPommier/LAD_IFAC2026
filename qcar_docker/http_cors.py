from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os, argparse, sys

class CORS(SimpleHTTPRequestHandler):
    def _allow_origin(self):
        allow = os.environ.get("CORS_ALLOW_ORIGIN", "*")
        origin = self.headers.get("Origin")

        # If wildcard is set, always return wildcard
        if allow == "*":
            self.send_header("Access-Control-Allow-Origin", "*")
            return True

        # If no Origin header (like curl), return wildcard for simplicity
        if not origin:
            self.send_header("Access-Control-Allow-Origin", "*")
            return True

        # Check if the origin is in the allowed list
        allowed = [o.strip() for o in allow.split(",") if o.strip()]
        if origin in allowed:
            self.send_header("Access-Control-Allow-Origin", origin)
            return True

        # Origin not allowed: don't send header so browser blocks
        try:
            print(f"[CORS] Origin no permitido: {origin} (permitidos: {allowed})", file=sys.stderr)
        except Exception:
            pass
        return False

    def end_headers(self):
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type")
        self._allow_origin()
        super().end_headers()

    # Manejo de preflight
    def do_OPTIONS(self):
        self.send_response(204)  # No Content
        self.end_headers()

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--dir", default=".")
    p.add_argument("--port", type=int, default=7000)
    args = p.parse_args()
    os.chdir(args.dir)
    print(f"Serving with CORS on :{args.port} (CORS_ALLOW_ORIGIN={os.environ.get('CORS_ALLOW_ORIGIN', '*')})")
    ThreadingHTTPServer(("", args.port), CORS).serve_forever()
