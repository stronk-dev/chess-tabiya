"""Offline real-model regression check; source probabilities, not a bot-play verdict."""
import json
import math
import re
import subprocess


def validate_pages(lines):
    pages = []
    rows = []
    for line in lines:
        if line.startswith("info "):
            token = re.search(r"\bpolicy ([^ ]+)", line)
            if token is None:
                raise ValueError("candidate omitted raw policy")
            value = float(token.group(1))
            if not math.isfinite(value) or not 0 <= value <= 1:
                raise ValueError("invalid source policy probability")
            rows.append(value)
        elif line.startswith("bestmove "):
            mass = sum(rows)
            if len(rows) != 20 or not math.isfinite(mass) or not 0 < mass <= 1 + 1e-9:
                raise ValueError(f"source all-legal policy mass refused: {mass!r} ({len(rows)} rows)")
            pages.append({"rows": len(rows), "mass": mass})
            rows = []
    if len(pages) != 2 or rows:
        raise ValueError("both complete real-model policy pages required")
    return pages


if __name__ == "__main__":
    commands = ["uci", "isready", "setoption name Elo value 1400",
                "setoption name Temperature value 0.8", "setoption name TopP value 0.92",
                "setoption name MultiPV value 20", "position startpos moves e2e4", "go",
                "position startpos moves d2d4", "go", "quit"]
    result = subprocess.run(["maia3-uci", "--model", "5m", "--checkpoint-path",
                             "/opt/maia3-models/maia3-5m.pt", "--use-uci-history"],
                            input="\n".join(commands) + "\n", text=True, capture_output=True,
                            timeout=90, check=True)
    lines = result.stdout.splitlines()
    if "uciok" not in lines or "readyok" not in lines:
        raise ValueError("actual runtime-user model readiness missing")
    print(json.dumps({"scope": "offline actual source probability contract", "pages": validate_pages(lines)}))
