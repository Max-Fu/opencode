#!/usr/bin/env python3
"""Logging HTTP proxy that chains to the sandbox's upstream proxy.

Logs every CONNECT target (HTTPS) and every absolute-form request line (HTTP),
then forwards verbatim. Point HTTPS_PROXY/HTTP_PROXY at this and read the log.
"""
import os
import socket
import sys
import threading
from datetime import datetime

LISTEN_PORT = int(os.environ.get("LOGPROXY_PORT", "8899"))
LOG_PATH = os.environ.get("LOGPROXY_LOG", "/tmp/logproxy.log")

upstream = os.environ.get("LOGPROXY_UPSTREAM", "")
if upstream.startswith("http://"):
    upstream = upstream[len("http://") :]
upstream = upstream.rstrip("/")
UP_HOST, _, UP_PORT = upstream.partition(":")
UP_PORT = int(UP_PORT or "80")

_lock = threading.Lock()


def log(kind, target):
    line = f"{datetime.now().isoformat(timespec='seconds')}\t{kind}\t{target}\n"
    with _lock:
        with open(LOG_PATH, "a") as fh:
            fh.write(line)
            fh.flush()


def pipe(a, b):
    try:
        while True:
            data = a.recv(65536)
            if not data:
                break
            b.sendall(data)
    except OSError:
        pass
    finally:
        for s in (a, b):
            try:
                s.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass


def handle(client):
    try:
        client.settimeout(30)
        head = b""
        while b"\r\n\r\n" not in head:
            chunk = client.recv(4096)
            if not chunk:
                return
            head += chunk
            if len(head) > 65536:
                return
        first = head.split(b"\r\n", 1)[0].decode("latin-1")
        parts = first.split()
        if len(parts) >= 2:
            if parts[0].upper() == "CONNECT":
                log("CONNECT", parts[1])
            else:
                log(parts[0].upper(), parts[1])

        up = socket.create_connection((UP_HOST, UP_PORT), timeout=30)
        up.sendall(head)
        threading.Thread(target=pipe, args=(client, up), daemon=True).start()
        pipe(up, client)
    except Exception as exc:  # noqa: BLE001
        log("ERROR", repr(exc))
    finally:
        try:
            client.close()
        except OSError:
            pass


def main():
    if not UP_HOST:
        print("LOGPROXY_UPSTREAM must be set to the real proxy", file=sys.stderr)
        return 1
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", LISTEN_PORT))
    srv.listen(128)
    print(f"logproxy on 127.0.0.1:{LISTEN_PORT} -> {UP_HOST}:{UP_PORT}, log={LOG_PATH}", flush=True)
    while True:
        client, _ = srv.accept()
        threading.Thread(target=handle, args=(client,), daemon=True).start()


if __name__ == "__main__":
    sys.exit(main())
