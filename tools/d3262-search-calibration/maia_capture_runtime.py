"""The packaged offline Maia runtime, shared by disposable capture instruments.

Matches workers/maia/Dockerfile's entrypoint. Callers still bind and verify the
actual checkpoint and adapter digest against their frozen source receipts.
"""
from pathlib import Path

from maia3.uci import parse_args


CHECKPOINT_PATH = "/opt/maia3-models/maia3-5m.pt"


def pinned_cfg():
    if not Path(CHECKPOINT_PATH).is_file():
        raise FileNotFoundError("Packaged pinned Maia checkpoint is missing: " + CHECKPOINT_PATH)
    return parse_args(["--model", "5m", "--checkpoint-path", CHECKPOINT_PATH,
                       "--use-uci-history", "--local-files-only", "--device", "cpu"])
