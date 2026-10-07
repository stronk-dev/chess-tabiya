"""Independent D3509 byte reconstruction, not a chess or timing oracle."""
import gzip
import hashlib
import json
import re
import sys
from pathlib import Path

FORMAT = "d3262-cost-byte-parts-v1"
MAX_PART_BYTES = 40 * 1024 * 1024


def digest(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def require(value, message):
    if not value:
        raise AssertionError("D3509_ARCHIVE_PARTS: " + message)


def assemble_parts(manifest, name, read_part):
    require(type(manifest) is dict and set(manifest) == {
        "format", "authority", "originalDigest", "originalBytes", "partBytes", "parts"}, "foreign fields")
    require(re.fullmatch(r"d3262-cost-live-[a-z0-9-]+\.json\.gz", name) is not None
            and manifest["format"] == FORMAT
            and manifest["authority"] == "lossless_byte_transport_not_recapture_or_measurement", "foreign format/authority")
    require(type(manifest["originalBytes"]) is int and manifest["originalBytes"] > 0
            and type(manifest["partBytes"]) is int and 0 < manifest["partBytes"] <= MAX_PART_BYTES,
            "invalid original/part size")
    require(type(manifest["originalDigest"]) is str
            and re.fullmatch(r"sha256:[a-f0-9]{64}", manifest["originalDigest"]) is not None, "invalid digest")
    parts = manifest["parts"]
    require(type(parts) is list and len(parts) == (manifest["originalBytes"] + manifest["partBytes"] - 1) // manifest["partBytes"],
            "missing/extra parts")
    pieces, offset = [], 0
    for index, part in enumerate(parts):
        require(type(part) is dict and set(part) == {"name", "offset", "bytes", "digest"}, "foreign part fields")
        require(part["name"] == f"{name}.part-{index:04d}" and type(part["offset"]) is int
                and part["offset"] == offset and type(part["bytes"]) is int
                and part["bytes"] == min(manifest["partBytes"], manifest["originalBytes"] - offset), "crossed part identity/order/range")
        raw = read_part(part["name"])
        require(type(raw) is bytes and len(raw) == part["bytes"] and digest(raw) == part["digest"], "missing/changed part bytes")
        offset += len(raw)
        pieces.append(raw)
    raw = b"".join(pieces)
    require(len(raw) == offset == manifest["originalBytes"] and digest(raw) == manifest["originalDigest"], "changed whole archive")
    return raw


def read_archive_bytes(path):
    path = Path(path)
    raw = path.read_bytes()
    plain = gzip.decompress(raw)
    if not plain.startswith(('{"format":"' + FORMAT + '"').encode()):
        return raw
    return assemble_parts(json.loads(plain), path.name, lambda name: (path.parent / name).read_bytes())


if __name__ == "__main__":
    require(len(sys.argv) == 2, "one explicit manifest/archive required")
    raw = read_archive_bytes(sys.argv[1])
    print(json.dumps(dict(originalDigest=digest(raw), originalBytes=len(raw),
                         validation="independent_python_byte_reconstruction_not_chess_or_clock_replay")))
