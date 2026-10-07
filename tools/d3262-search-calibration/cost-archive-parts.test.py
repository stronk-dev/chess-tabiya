"""Independent byte-layout falsifiers; fixtures are synthetic, not live evidence."""
import copy
import gzip
import json
import runpy
import tempfile
import unittest
from pathlib import Path

reader = runpy.run_path(str(Path(__file__).with_name("cost-archive-parts-check.py")))
sha = reader["digest"]
name = "d3262-cost-live-test-parts.json.gz"
raw = gzip.compress(b'{"version":1,"syntheticControl":true}')


def fixture():
    pieces = {f"{name}.part-{index:04d}": raw[offset:offset + 16]
              for index, offset in enumerate(range(0, len(raw), 16))}
    manifest = dict(format=reader["FORMAT"], authority="lossless_byte_transport_not_recapture_or_measurement",
                    originalDigest=sha(raw), originalBytes=len(raw), partBytes=16,
                    parts=[dict(name=n, offset=index * 16, bytes=len(b), digest=sha(b))
                           for index, (n, b) in enumerate(pieces.items())])
    return manifest, pieces


class PartsControls(unittest.TestCase):
    def test_literal_legacy_and_filesystem_parts(self):
        manifest, pieces = fixture()
        with tempfile.TemporaryDirectory(prefix="d3509-parts-") as directory:
            path = Path(directory) / name
            path.write_bytes(gzip.compress(json.dumps(manifest, separators=(",", ":")).encode()))
            for n, b in pieces.items(): (path.parent / n).write_bytes(b)
            self.assertEqual(reader["read_archive_bytes"](path), raw)
            legacy = path.parent / "legacy.json.gz"; legacy.write_bytes(raw)
            self.assertEqual(reader["read_archive_bytes"](legacy), raw)

    def test_custody_corruptions(self):
        for mode in ["authority", "field", "format", "missing", "extra", "order", "duplicate",
                     "path", "identity", "offset", "length", "part_digest", "whole_digest",
                     "whole_size", "oversize", "zero", "fractional", "bool_size", "part_field"]:
            with self.subTest(mode=mode):
                m, pieces = fixture()
                if mode == "authority": m["authority"] = "new_measurement"
                elif mode == "field": m["complete"] = True
                elif mode == "format": m["format"] = "other"
                elif mode == "missing": m["parts"].pop()
                elif mode == "extra": m["parts"].append(m["parts"][0])
                elif mode == "order": m["parts"].reverse()
                elif mode == "duplicate": m["parts"][1] = copy.deepcopy(m["parts"][0])
                elif mode == "path": m["parts"][0]["name"] = "../other"
                elif mode == "identity": m["parts"][0]["name"] = "other.json.gz.part-0000"
                elif mode == "offset": m["parts"][1]["offset"] += 1
                elif mode == "length": m["parts"][0]["bytes"] -= 1
                elif mode == "part_digest": m["parts"][0]["digest"] = sha(b"wrong")
                elif mode == "whole_digest": m["originalDigest"] = sha(b"wrong")
                elif mode == "whole_size": m["originalBytes"] += 1
                elif mode == "oversize": m["partBytes"] = reader["MAX_PART_BYTES"] + 1
                elif mode == "zero": m["partBytes"] = 0
                elif mode == "fractional": m["partBytes"] = 0.5
                elif mode == "bool_size": m["originalBytes"] = True
                else: m["parts"][0]["extra"] = "no"
                with self.assertRaises(AssertionError): reader["assemble_parts"](m, name, pieces.get)

    def test_resealed_changed_part_still_fails_whole_digest(self):
        m, pieces = fixture(); first = m["parts"][0]["name"]
        pieces[first] = bytes([pieces[first][0] ^ 1]) + pieces[first][1:]
        m["parts"][0]["digest"] = sha(pieces[first])
        with self.assertRaisesRegex(AssertionError, "whole archive"):
            reader["assemble_parts"](m, name, pieces.get)

    def test_missing_truncated_and_foreign_typed_bytes_refuse(self):
        for mode in ["missing", "truncated", "text"]:
            with self.subTest(mode=mode):
                m, pieces = fixture(); first = m["parts"][0]["name"]
                if mode == "missing": pieces.pop(first)
                elif mode == "truncated": pieces[first] = pieces[first][1:]
                else: pieces[first] = "not bytes"
                with self.assertRaises(AssertionError): reader["assemble_parts"](m, name, pieces.get)


if __name__ == "__main__": unittest.main()
