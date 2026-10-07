"""Synthetic independent selection controls, never native measurement."""
import base64
import copy
import gzip
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("selection_checker", Path(__file__).with_name("cost-isolation-selection-check.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def fixture():
    source, protocol, successor = b"original source", b"synthetic preregistration", {"successor": b"synthetic successor"}
    cell = {"rootId": "synthetic", "candidateUci": "e2e4", "setting": "recursive:depth12:top8:top8", "horizon": 4, "regime": "cold"}
    records = []
    for regime in ("cold", "warm", "provider_offline"):
        raw = {"cell": dict(cell, regime=regime), "result": {"kind": "budget_exhausted" if regime == "cold" else "source_unavailable"},
               "dependencies": [{"state": "timed_out", "failure": "UCI operation deadline"}] if regime == "cold" else []}
        records.append({"raw": raw, "row": dict(raw["cell"], kind=raw["result"]["kind"], rawCaptureDigest=m.sha(json.dumps(raw).encode()))})
    compressed = gzip.compress(json.dumps(records).encode())
    group = {"name": "triplet-000000.json.gz", "digest": m.sha(compressed), "base64": base64.b64encode(compressed).decode()}
    metadata = {"planDigest": m.sha(b"plan"), "provider": {"sourceDigest": m.sha(b"binary"), "timeoutMs": 60000},
                "instrumentDigests": {"original": m.sha(source)}, "cases": [r["raw"]["cell"] for r in records]}
    parent = {"metadata": metadata, "sourceSnapshot": {"original": base64.b64encode(source).decode()},
              "groups": [group], "summary": {"groups": [{"name": group["name"], "digest": group["digest"]}]}}
    original_digest = m.sha(b"synthetic parent bytes")
    selection = {"version": 1, "question": "D3512", "authority": "frozen_failed_source_successor_selection_not_native_results",
                 "parent": {"name": m.PARENT_NAME, "digest": original_digest, "planDigest": metadata["planDigest"],
                            "sourceDigest": metadata["provider"]["sourceDigest"], "timeoutMs": 60000, "instrumentDigests": metadata["instrumentDigests"]},
                 "protocol": {"name": "d3512-source-isolation-preregistration-2026-10-07.md", "digest": m.sha(protocol), "base64": base64.b64encode(protocol).decode()},
                 "successorSources": {"successor": {"digest": m.sha(successor["successor"]), "base64": base64.b64encode(successor["successor"]).decode()}},
                 "entries": [{"groupName": group["name"], "groupDigest": group["digest"], "cell": cell,
                              "originalRecords": [{"identity": m.identity(r["row"]), "rawCaptureDigest": r["row"]["rawCaptureDigest"]} for r in records]}],
                 "coldCases": 1, "cases": 3, "nativeExecuted": False, "productionProfileSelected": False}
    return selection, parent, original_digest, protocol, successor


class Selection(unittest.TestCase):
    def test_positive_original_failure_is_retained(self):
        args = fixture()
        result = m.verify_selection(*args, expected_cold=1)
        self.assertEqual(result["originalCases"], 3)
        self.assertEqual(result["coldCases"], 1)
        self.assertFalse(result["nativeExecuted"])

    def test_selection_mutations(self):
        mutations = {
            "drop": lambda s: s["entries"].pop(),
            "duplicate": lambda s: s["entries"].append(copy.deepcopy(s["entries"][0])),
            "identity": lambda s: s["entries"][0]["cell"].update(candidateUci="e2e3"),
            "raw": lambda s: s["entries"][0]["originalRecords"][0].update(rawCaptureDigest=m.sha(b"foreign")),
            "original_digest": lambda s: s["parent"].update(digest=m.sha(b"foreign")),
            "source": lambda s: s["parent"].update(sourceDigest=m.sha(b"foreign")),
            "deadline": lambda s: s["parent"].update(timeoutMs=60001),
            "native": lambda s: s.update(nativeExecuted=True),
            "profile": lambda s: s.update(productionProfileSelected=True),
            "new_field": lambda s: s.update(qualifiedSettings=29),
            "protocol": lambda s: s["protocol"].update(digest=m.sha(b"foreign")),
            "instrument": lambda s: s["successorSources"]["successor"].update(base64=base64.b64encode(b"foreign").decode()),
        }
        for name, mutate in mutations.items():
            with self.subTest(name=name):
                args = list(copy.deepcopy(fixture()))
                mutate(args[0])
                with self.assertRaises(ValueError):
                    m.verify_selection(*args, expected_cold=1)

    def test_original_custody_mutations(self):
        for name in ("compressed", "source", "population", "summary"):
            with self.subTest(name=name):
                args = list(copy.deepcopy(fixture()))
                parent = args[1]
                if name == "compressed":
                    parent["groups"][0]["base64"] = base64.b64encode(b"foreign").decode()
                elif name == "source":
                    parent["sourceSnapshot"]["original"] = base64.b64encode(b"foreign").decode()
                elif name == "population":
                    parent["metadata"]["cases"].pop()
                else:
                    parent["summary"]["groups"].pop()
                with self.assertRaises(ValueError):
                    m.verify_selection(*args, expected_cold=1)


if __name__ == "__main__":
    unittest.main()
