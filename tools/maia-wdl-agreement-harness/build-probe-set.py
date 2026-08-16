#!/usr/bin/env python3
"""DISPOSABLE research harness — does Maia's per-move WDL agree with human outcomes?
Not production code. Nothing imports it.

Joins R9's committed explorer readings (the ground truth this question is defined
against) to the r4 position extractor's history, and emits the probe set. The join
key is the FEN, because the explorer's unit is the position, not the move order.
"""
import csv
import json
import sys

readings_csv, r4_positions, out_path = sys.argv[1:4]

rows = [r for r in csv.DictReader(open(readings_csv)) if r["source"] == "main"]
by_fen = {p["fen"]: p for p in json.load(open(r4_positions))["positions"]}

fens = {}
for r in rows:
    fens.setdefault(r["fen"], {"fen": r["fen"], "ply": int(r["ply"]), "phase": r["phase"],
                               "packId": r["packId"], "legalCount": int(r["legalCount"]),
                               "pieceCount": int(r["pieceCount"]), "bands": {}})
    fens[r["fen"]]["bands"][r["band"]] = {
        "total": int(r["total"]), "white": int(r["white"]), "draws": int(r["draws"]),
        "black": int(r["black"]),
        "moves": [],
    }
    for token in r["topMoves"].split(";"):
        if not token:
            continue
        san, total, wdb = token.split(":")
        white, draws, black = (int(v) for v in wdb.split("/"))
        fens[r["fen"]]["bands"][r["band"]]["moves"].append(
            {"san": san, "n": int(total), "white": white, "draws": draws, "black": black})

positions = []
for fen, entry in sorted(fens.items(), key=lambda kv: (kv[1]["ply"], kv[0])):
    source = by_fen[fen]
    entry["startFen"] = source["startFen"]
    entry["historyUci"] = source["historyUci"]
    positions.append(entry)

json.dump({"positions": positions}, open(out_path, "w"), indent=1)
print(f"positions={len(positions)} bands={sorted({b for p in positions for b in p['bands']})}")
