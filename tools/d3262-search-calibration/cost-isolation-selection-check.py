"""Independent D3512 cohort/custody replay. No native/chess/clock claims."""
import base64
import gzip
import hashlib
import json
from pathlib import Path
import sys

PARENT_NAME = "d3262-cost-live-recursive-depth12-2026-10-07.json.gz"
PARENT_DIGEST = "sha256:d8d2855784a4baadad3f36851294b2feef7c53b34a27a57f0d293b7ef0e5bf65"
DIRECTORY = Path("planning/semantic-consequence-search")
SOURCE_DIRECTORY = Path("tools/d3262-search-calibration")


def sha(data):
    return "sha256:" + hashlib.sha256(data).hexdigest()


def require(condition, reason):
    if not condition:
        raise ValueError("D3512_INDEPENDENT_SELECTION: " + reason)


def identity(cell):
    return json.dumps([cell[k] for k in ("rootId", "candidateUci", "setting", "horizon", "regime")],
                      separators=(",", ":"), ensure_ascii=False)


def verify_selection(selection, parent, original_digest, protocol, successor_sources, expected_cold=697):
    require(set(selection) == {"version", "question", "authority", "parent", "protocol", "successorSources",
                              "entries", "coldCases", "cases", "nativeExecuted", "productionProfileSelected"}, "selection fields")
    require(selection["version"] == 1 and selection["question"] == "D3512"
            and selection["authority"] == "frozen_failed_source_successor_selection_not_native_results"
            and selection["nativeExecuted"] is False and selection["productionProfileSelected"] is False, "false native/profile authority")
    metadata = parent["metadata"]
    expected_parent = {"name": PARENT_NAME, "digest": original_digest, "planDigest": metadata["planDigest"],
                       "sourceDigest": metadata["provider"]["sourceDigest"], "timeoutMs": metadata["provider"]["timeoutMs"],
                       "instrumentDigests": metadata["instrumentDigests"]}
    require(selection["parent"] == expected_parent, "changed original source/plan identity")
    require(set(parent["sourceSnapshot"]) == set(metadata["instrumentDigests"]), "original source catalogue")
    for name, digest in metadata["instrumentDigests"].items():
        require(sha(base64.b64decode(parent["sourceSnapshot"][name], validate=True)) == digest, "changed retained original source")
    require(selection["protocol"] == {"name": "d3512-source-isolation-preregistration-2026-10-07.md",
                                      "digest": sha(protocol), "base64": base64.b64encode(protocol).decode()}, "changed preregistration")
    require(set(selection["successorSources"]) == set(successor_sources), "successor source catalogue")
    for name, data in successor_sources.items():
        require(selection["successorSources"][name] == {"digest": sha(data), "base64": base64.b64encode(data).decode()}, "changed successor source")
    require([{k: g[k] for k in ("name", "digest")} for g in parent["groups"]] == parent["summary"]["groups"], "changed group summary")
    entries, all_cells, seen = [], [], set()
    for group in parent["groups"]:
        compressed = base64.b64decode(group["base64"], validate=True)
        require(sha(compressed) == group["digest"], "changed compressed original group")
        records = json.loads(gzip.decompress(compressed))
        require(len(records) == 3, "missing original regime")
        cold = records[0]
        for record, regime in zip(records, ("cold", "warm", "provider_offline")):
            cell = dict(cold["raw"]["cell"], regime=regime)
            require(record["raw"]["cell"] == cell and identity(record["row"]) == identity(cell)
                    and record["row"]["kind"] == record["raw"]["result"]["kind"], "crossed original case/outcome")
            key = identity(cell)
            require(key not in seen, "duplicate original case")
            seen.add(key)
            all_cells.append(cell)
        deadline = any(d["state"] == "timed_out" and d["failure"] == "UCI operation deadline"
                       for d in cold["raw"]["dependencies"])
        if deadline:
            require(cold["row"]["kind"] == "budget_exhausted", "deadline/result mismatch")
            entries.append({"groupName": group["name"], "groupDigest": group["digest"], "cell": cold["raw"]["cell"],
                            "originalRecords": [{"identity": identity(r["row"]), "rawCaptureDigest": r["row"]["rawCaptureDigest"]}
                                                for r in records]})
    require(all_cells == metadata["cases"], "changed full original case order/population")
    require(len(entries) == expected_cold and selection["coldCases"] == expected_cold
            and selection["cases"] == expected_cold * 3 and selection["entries"] == entries, "changed affected cohort/count/order/raw custody")
    return {"coldCases": len(entries), "cases": len(entries) * 3, "originalCases": len(all_cells),
            "nativeExecuted": False, "independentScope": "selection_and_byte_custody_not_new_source_board_or_clock"}


if __name__ == "__main__":
    require(len(sys.argv) == 2, "one frozen selection path required")
    parent_bytes = (DIRECTORY / PARENT_NAME).read_bytes()
    require(sha(parent_bytes) == PARENT_DIGEST, "changed independently replayed parent archive")
    parent = json.loads(gzip.decompress(parent_bytes))
    require(parent["version"] == 1 and parent["authority"] == "lossless_partial_cost_capture_not_full_profile"
            and parent["metadata"]["start"] == 46320 and parent["metadata"]["limit"] == 6948
            and len(parent["groups"]) == 2316, "changed full original population")
    require(parent["metadata"]["planDigest"] == sha((DIRECTORY / "d3262-cost-plan-v1.json").read_bytes()), "changed frozen plan")
    for name, digest in parent["metadata"]["instrumentDigests"].items():
        require(sha((SOURCE_DIRECTORY / name).read_bytes()) == digest, "changed current original executor")
    selection_bytes = Path(sys.argv[1]).read_bytes()
    result = verify_selection(json.loads(selection_bytes), parent, PARENT_DIGEST,
                              (DIRECTORY / "d3512-source-isolation-preregistration-2026-10-07.md").read_bytes(),
                              {name: (SOURCE_DIRECTORY / name).read_bytes() for name in
                               ("cost-case-isolation.mjs", "cost-isolation-selection.mjs")})
    print(json.dumps(dict(result, selectionDigest=sha(selection_bytes)), separators=(",", ":")))
