#!/usr/bin/env python3
"""Tiny stdlib HTTP server for the quiz site.

Serves files from the current directory on http://localhost:8000.
Usage:
    python3 server.py [port]
"""

from __future__ import annotations

import http.server
import socketserver
import sys
from pathlib import Path


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    root = Path(__file__).resolve().parent
    Handler.directory = str(root)
    with socketserver.TCPServer(("0.0.0.0", port), Handler) as httpd:
        print(f"Serving {root} at http://localhost:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nbye")


if __name__ == "__main__":
    main()
