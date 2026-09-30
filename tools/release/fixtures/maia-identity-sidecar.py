"""Identity transport fixture, NOT Maia inference: real sidecar, readiness-only UCI stub."""
import importlib.util
import socket
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location("sidecar", "workers/maia/sidecar.py")
sidecar = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sidecar)
sidecar.HOST = "127.0.0.1"
sidecar.PORT = 0
sidecar.READY = Path(sys.argv[1])
stub = """import sys
for line in sys.stdin:
    command = line.strip()
    if command == "uci": print("uciok", flush=True)
    elif command == "isready": print("readyok", flush=True)
    elif command == "quit": break
"""
sidecar.COMMAND = [sys.executable, "-u", "-c", stub]
original_socket = socket.socket


class AnnouncedSocket(original_socket):
    def listen(self, backlog=1):
        super().listen(backlog)
        print("PORT:" + str(self.getsockname()[1]), flush=True)


socket.socket = AnnouncedSocket
raise SystemExit(sidecar.main())
