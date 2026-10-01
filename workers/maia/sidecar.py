#!/usr/bin/env python3
"""One-process TCP bridge around the pinned Maia UCI entry point."""

from __future__ import annotations

import json
import os
import platform
import re
import selectors
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path


HOST = os.environ.get("MAIA_LISTEN_HOST", "0.0.0.0")
PORT = int(os.environ.get("MAIA_LISTEN_PORT", "7000"))
READY = Path(os.environ.get("MAIA_READY_FILE", "/tmp/ready"))
COMMAND = ["maia3-uci", "--model", "5m", "--checkpoint-path", "/opt/maia3-models/maia3-5m.pt", "--use-uci-history"]
# rfc/provider-health-degradation.md §3 / rfc/provider-exchange-and-execution.md §3: the running
# container's OCI identity, injected by the release compiler from the registry's own digests. The
# sidecar only reports it; it never invents one.
IDENTITY_REQUEST = b"tabiya-identity\n"
DIGEST = re.compile(r"^sha256:[0-9a-f]{64}$")


def container_identity() -> bytes:
    image_id = os.environ.get("MAIA_IMAGE_ID", "")
    manifest = os.environ.get("MAIA_MANIFEST_DIGEST", "")
    # Release metadata contains both platform configs; choose the actual running architecture.
    # The scalar remains a development-only input when no release map was supplied. An invalid
    # release map never falls back to it, even if that scalar would be well formed.
    config = ""
    encoded_configs = os.environ.get("MAIA_PLATFORM_CONFIG_DIGESTS")
    if encoded_configs is None:
        config = os.environ.get("MAIA_CONFIG_DIGEST", "")
    else:
        try:
            configs = json.loads(encoded_configs)
            native = {"x86_64": "linux/amd64", "aarch64": "linux/arm64", "arm64": "linux/arm64"}.get(platform.machine())
            if isinstance(configs, dict) and set(configs) == {"linux/amd64", "linux/arm64"} and all(
                isinstance(value, str) and DIGEST.fullmatch(value) for value in configs.values()
            ):
                config = configs.get(native, "")
        except (ValueError, TypeError):
            pass
    if image_id == "" or not DIGEST.fullmatch(manifest) or not DIGEST.fullmatch(config):
        body = {"unavailable": "container identity was not injected into this deployment"}
    else:
        body = {"runtime": "oci", "imageId": image_id, "manifestDigest": manifest, "configDigest": config}
    return (json.dumps(body, sort_keys=True) + "\n").encode()


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


def read_connection_start(client: socket.socket) -> bytes:
    """Frame only the identity prefix, preserving ordinary UCI bytes and one absolute deadline."""
    deadline = time.monotonic() + 5
    client.settimeout(5)
    first = client.recv(65_536)
    while first and first != IDENTITY_REQUEST and IDENTITY_REQUEST.startswith(first):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError("identity request deadline")
        client.settimeout(remaining)
        chunk = client.recv(len(IDENTITY_REQUEST) - len(first))
        if not chunk:
            # A partial probe must not leak into the shared UCI engine's next command.
            return b""
        first += chunk
    return first


class ClientCommands:
    """Frame complete UCI lines; a client's quit releases its lease, not the shared child."""

    def __init__(self) -> None:
        self.pending = b""

    def feed(self, data: bytes) -> tuple[bytes, bool]:
        self.pending += data
        forwarded = bytearray()
        while b"\n" in self.pending:
            line, self.pending = self.pending.split(b"\n", 1)
            if len(line) > 65_536:
                raise ValueError("UCI command exceeds the connection limit")
            if line.strip() == b"quit":
                self.pending = b""
                return bytes(forwarded), True
            forwarded.extend(line + b"\n")
        if len(self.pending) > 65_536:
            raise ValueError("UCI command exceeds the connection limit")
        return bytes(forwarded), False


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
        # The first line of a connection may be the identity probe; anything else is UCI traffic.
        try:
            first = read_connection_start(client)
        except OSError:
            first = b""
        if not first:
            client.close()
            continue
        if first.startswith(IDENTITY_REQUEST):
            try:
                client.sendall(container_identity())
            finally:
                client.close()
            continue
        commands = ClientCommands()
        try:
            forwarded, quit_requested = commands.feed(first)
        except ValueError:
            client.close()
            continue
        if forwarded:
            assert engine.stdin is not None
            engine.stdin.write(forwarded)
            engine.stdin.flush()
        if quit_requested:
            client.close()
            continue
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
                        forwarded, quit_requested = commands.feed(data)
                        if forwarded:
                            assert engine.stdin is not None
                            engine.stdin.write(forwarded)
                            engine.stdin.flush()
                        if quit_requested:
                            connected = False
                            break
                    else:
                        data = os.read(engine.stdout.fileno(), 65_536)
                        if not data:
                            connected = False
                            break
                        client.sendall(data)
        except (ConnectionError, ValueError):
            # A disconnected or oversized client cannot kill the container-owned model.
            pass
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
