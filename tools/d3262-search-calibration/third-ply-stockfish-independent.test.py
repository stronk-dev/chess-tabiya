"""Synthetic independent-validator controls, never engine observations."""
import copy
import importlib.util
import unittest
from pathlib import Path

import chess

spec = importlib.util.spec_from_file_location("source_check", Path(__file__).with_name("third-ply-stockfish-independent.py"))
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


def fixture(fen=None):
    board = chess.Board(fen) if fen else chess.Board()
    fen = board.fen()
    legal = sorted(move.uci() for move in board.legal_moves)
    source = {"engineName": "Synthetic NOT provider", "threads": 1, "hashMb": 16,
              "multiPv": "top8_legal_moves_at_selected_third_ply", "scorePerspective": "raw_uci_uninterpreted",
              "executableDigest": "synthetic_not_a_binary"}
    job = {"id": checker.digest(fen.encode()), "fen": fen, "budgets": ["depth8"]}
    frame = {"manifest": "synthetic_not_a_population", "supplementJobs": [job], "finalPlyQueries": {"stockfish": source}}
    raw = b"synthetic-frame-not-provider-bytes"
    entries = [{"moveUci": uci, "rank": index + 1, "depth": 8,
                "score": {"kind": "cp", "value": 0, "bound": False}, "pv": [uci]}
               for index, uci in enumerate(legal[:8])]
    capture = {"version": 1, "manifest": frame["manifest"], "frontierDigest": checker.digest(raw),
               "start": 0, "positions": 1, "partial": False, "source": source,
               "captureScope": "semantic_third_ply_missing_budgets_only",
               "rows": [{"jobId": job["id"], "fen": fen, "budgets": ["depth8"], "probes": [{
                   "budget": "depth8", "terminal": False, "legal": legal, "elapsedMs": 1,
                   "entries": entries, "coherentDepth": 8, "trailingPartialDepth": None,
                   "bestmove": legal[0], "missingMoves": legal[8:]}]}],
               "chunkDigests": [{"file": "chunk-0000-0000.json", "positions": 1, "sha256": "sha256:" + "0" * 64}]}
    # Avoid shared fixture aliases hiding the intended source corruption.
    return copy.deepcopy(frame), raw, copy.deepcopy(capture)


class IndependentSourceControls(unittest.TestCase):
    def test_recursive_and_prior_populations_keep_separate_declared_scopes(self):
        frame, raw, capture = fixture()
        scope = "recursive_semantic_third_ply_missing_budgets_only"
        with self.assertRaisesRegex(AssertionError, "capture scope"):
            checker.verify(frame, raw, capture, True, scope)
        capture["captureScope"] = scope
        self.assertEqual(checker.verify(frame, raw, capture, True, scope)["positions"], 1)
        with self.assertRaisesRegex(AssertionError, "capture scope"):
            checker.verify(frame, raw, capture, True)
        with self.assertRaisesRegex(AssertionError, "Undeclared"):
            checker.verify(frame, raw, capture, True, "anything")

    def test_original_provider_legal_terminal_contract_is_not_rewritten(self):
        frame, raw, capture = fixture("8/8/8/8/8/8/4K3/6k1 w - - 0 1")
        frame["engineJobs"] = frame["supplementJobs"]
        capture.pop("captureScope")
        self.assertEqual(checker.verify(frame, raw, capture, False)["positions"], 1)
        capture["captureScope"] = "semantic_third_ply_missing_budgets_only"
        with self.assertRaisesRegex(AssertionError, "nonterminal semantic source"):
            checker.verify(frame, raw, capture, True)

    def test_complete_synthetic_source_shape(self):
        frame, raw, capture = fixture()
        self.assertEqual(checker.verify(frame, raw, capture, True), {
            "positions": 1, "budgetQueries": 1, "rankedEntries": 8,
            "independentlyReplayedPvMoves": 8, "intervals": 1})

    def test_booleans_do_not_impersonate_numeric_source_operands(self):
        mutations = [
            (lambda value: value.update({"version": True}), "source frame"),
            (lambda value: value.update({"start": False}), "population"),
            (lambda value: value["source"].update({"threads": True}), "query identity"),
            (lambda value: value["rows"][0]["probes"][0]["entries"][0].update({"rank": True}), "rank/PV"),
            (lambda value: value["rows"][0]["probes"][0].update({"elapsedMs": True}), "timing"),
        ]
        for mutate, guard in mutations:
            frame, raw, capture = fixture()
            mutate(capture)
            with self.assertRaisesRegex(AssertionError, guard):
                checker.verify(frame, raw, capture, True)

    def test_invalid_uci_reports_the_intended_pv_guard(self):
        frame, raw, capture = fixture()
        capture["rows"][0]["probes"][0]["entries"][0]["pv"].append("a1a1")
        with self.assertRaisesRegex(AssertionError, "Illegal independent provider PV"):
            checker.verify(frame, raw, capture, True)

    def test_partial_population_and_false_interval_history_are_not_full_sources(self):
        for mutate, guard in [
            (lambda value: value.update({"partial": True}), "population"),
            (lambda value: value["chunkDigests"][0].update({"positions": 2}), "interval history"),
            (lambda value: value["rows"][0]["probes"].clear(), "budget query"),
        ]:
            frame, raw, capture = fixture()
            mutate(capture)
            with self.assertRaisesRegex(AssertionError, guard):
                checker.verify(frame, raw, capture, True)


if __name__ == "__main__":
    unittest.main()
