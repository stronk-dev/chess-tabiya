#!/usr/bin/env python3
"""One-process TCP bridge around the pinned Maia UCI entry point."""

from __future__ import annotations

import os
import selectors
import signal
import socket
import subprocess
import sys
from pathlib import Path


HOST = os.environ.get("MAIA_LISTEN_HOST", "0.0.0.0")
PORT = int(os.environ.get("MAIA_LISTEN_PORT", "7000"))
READY = Path(os.environ.get("MAIA_READY_FILE", "/ready"))
COMMAND = ["maia3-uci", "--model", "5m", "--use-uci-history"]


def send(engine: subprocess.Popen[bytes], line: str) -> None:
    assert engine.stdin is not None
    engine.stdin.write(f"{line}\n".encode())
    engine.stdin.flush()


def read_until(engine: subprocess.Popen[bytes], expected: bytes) -> None:
    assert engine.stdout is not None
    while True:
        line = engine.stdout.readline()
        if not line:
            raise RuntimeError("Maia exited during readiness self-test")
        if line.strip() == expected:
            return


def main() -> int:
    READY.unlink(missing_ok=True)
    engine = subprocess.Popen(
        COMMAND,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=sys.stderr,
        bufsize=0,
    )
    send(engine, "uci")
    read_until(engine, b"uciok")
    send(engine, "isready")
    read_until(engine, b"readyok")

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, PORT))
    server.listen(1)
    READY.touch()

    stopping = False

    def stop(_signum: int, _frame: object) -> None:
        nonlocal stopping
        stopping = True
        server.close()

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)

    assert engine.stdout is not None
    while not stopping and engine.poll() is None:
        try:
            client, _address = server.accept()
        except OSError:
            break
        client.setblocking(False)
        selector = selectors.DefaultSelector()
        selector.register(client, selectors.EVENT_READ, "client")
        selector.register(engine.stdout, selectors.EVENT_READ, "engine")
        try:
            connected = True
            while connected and not stopping and engine.poll() is None:
                for key, _mask in selector.select(timeout=1):
                    if key.data == "client":
                        data = client.recv(65_536)
                        if not data:
                            connected = False
                            break
                        assert engine.stdin is not None
                        engine.stdin.write(data)
                        engine.stdin.flush()
                    else:
                        data = os.read(engine.stdout.fileno(), 65_536)
                        if not data:
                            connected = False
                            break
                        client.sendall(data)
        finally:
            selector.close()
            client.close()

    READY.unlink(missing_ok=True)
    if engine.poll() is None:
        send(engine, "quit")
        try:
            engine.wait(timeout=5)
        except subprocess.TimeoutExpired:
            engine.kill()
    return engine.returncode or 0


if __name__ == "__main__":
    raise SystemExit(main())
