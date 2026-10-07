"""Disposable D3262 full-population replay boundary controls."""
import copy
import base64
import gzip
import json
import runpy
import unittest
from pathlib import Path
import chess

checker = runpy.run_path(str(Path(__file__).with_name("cost-independent.py")))
verify = checker["verify_plain_population"]
verify_pv = checker["verify_pv_population"]
root = chess.STARTING_FEN


def pv_fixture(horizon=4, budget="depth8"):
    entry = dict(moveUci="e2e4", pv=["e2e4", "a7a6", "b1a3", "a6a5"])
    row = dict(setting="pv:" + budget, candidateUci="e2e4", horizon=horizon)
    raw = dict(dependencies=[dict(operands=dict(provider="stockfish", fen=root, budget=budget, multiPv=20),
                                 receipt=dict(result=dict(entries=[entry])))],
               result=dict(nodeCap=1, visited=0, providerPv=copy.deepcopy(entry),
                           observations=[dict(targetId=tid, history=entry["pv"][:horizon]) for tid in ["test", "other"]]))
    return row, raw


def engine_fixture(horizon=4, cap=25000):
    histories = [["e2e4", "a7a6"], ["e2e4", "a7a6", "b1a3"], ["e2e4", "a7a6", "b1a3", "a6a5"]]
    queries = []
    for path, selected in [(["e2e4"], "a7a6"), (histories[0], "b1a3"), (histories[1], "a6a5")]:
        board = checker["board_at"](root, path)
        queries.append(dict(operands=dict(provider="stockfish", fen=board.fen(en_passant="legal"), budget="depth8", multiPv=8),
                            receipt=dict(result=dict(entries=[dict(moveUci=selected)]))))
    count = 1 if horizon == 2 else 3
    row = dict(setting="engine:depth8:top2", candidateUci="e2e4", horizon=horizon)
    raw = dict(dependencies=queries[:min(count, cap + 1)], result=dict(nodeCap=cap, visited=min(count, cap + 1), providerPv=None,
        observations=[dict(targetId="test", history=p) for p in histories[:min(count, cap)]]))
    return row, raw


def wide_engine_fixture(width, horizon=4, budget="depth8", targets=("test",)):
    """Legal synthetic rank receipts; assert nontrivial full-width cardinality.

    Rank order is reverse lexical; the first preparation loop is deliberately
    canonical, while both deeper loops must retain source rank order.
    """
    dependencies, observed, seen = [], [], {}
    def selected(history):
        board = checker["board_at"](root, history)
        fen = board.fen(en_passant="legal")
        if fen not in seen:
            entries = [dict(moveUci=m.uci()) for m in sorted(board.legal_moves, key=lambda m: m.uci(), reverse=True)[:8]]
            dependencies.append(dict(operands=dict(provider="stockfish", fen=fen, budget=budget, multiPv=8),
                                     receipt=dict(result=dict(entries=entries))))
            seen[fen] = [x["moveUci"] for x in entries[:width]]
        return seen[fen]
    first = selected(["e2e4"])
    for tid in targets:
        for preparation in sorted(first):
            second = ["e2e4", preparation]
            observed.append(dict(targetId=tid, history=second))
            if horizon == 2:
                continue
            for defence in selected(second):
                third = second + [defence]
                observed.append(dict(targetId=tid, history=third))
                for leaf in selected(third):
                    observed.append(dict(targetId=tid, history=third + [leaf]))
    return dict(setting=f"engine:{budget}:top{width}", candidateUci="e2e4", horizon=horizon), dict(
        dependencies=dependencies, result=dict(nodeCap=25000, visited=len(observed), providerPv=None, observations=observed))


class PopulationTests(unittest.TestCase):
    def test_pv_exact_root_query_for_all_budgets_and_horizons(self):
        for budget in ["depth8", "depth12", "movetime100"]:
            for horizon in [2, 4]:
                with self.subTest(budget=budget, horizon=horizon):
                    row, raw = pv_fixture(horizon, budget)
                    verify_pv(row, raw, root, ["test", "other"])

    def test_pv_short_line_remains_short(self):
        row, raw = pv_fixture()
        raw["dependencies"][0]["receipt"]["result"]["entries"][0]["pv"] = ["e2e4"]
        raw["result"]["providerPv"]["pv"] = ["e2e4"]
        for observation in raw["result"]["observations"]:
            observation["history"] = ["e2e4"]
        verify_pv(row, raw, root, ["test", "other"])

    def test_pv_failed_source_has_no_entry_or_observations(self):
        row, raw = pv_fixture()
        raw["dependencies"][0]["receipt"] = None
        raw["result"].update(providerPv=None, observations=[])
        verify_pv(row, raw, root, ["test", "other"])
        raw["result"]["observations"] = [dict(targetId="test", history=["e2e4"])]
        with self.assertRaisesRegex(AssertionError, "scheduled PV population"):
            verify_pv(row, raw, root, ["test", "other"])

    def test_pv_no_target_and_terminal_do_not_query(self):
        for targets, fen, candidate in [([], root, "e2e4"), (["test"], "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", "g6g7")]:
            with self.subTest(targets=targets):
                row, raw = pv_fixture()
                row["candidateUci"] = candidate
                raw["dependencies"] = []
                raw["result"].update(providerPv=None, observations=[])
                verify_pv(row, raw, fen, targets)
                raw["dependencies"] = pv_fixture()[1]["dependencies"]
                with self.assertRaisesRegex(AssertionError, "scheduled PV query"):
                    verify_pv(row, raw, fen, targets)

    def test_pv_crossed_provider_root_budget_and_legal_width_refuse(self):
        for field, value in [("provider", "maia"), ("fen", root.replace("0 1", "0 2")),
                             ("budget", "depth12"), ("multiPv", 8)]:
            with self.subTest(field=field):
                row, raw = pv_fixture()
                raw["dependencies"][0]["operands"][field] = value
                with self.assertRaisesRegex(AssertionError, "crossed scheduled PV query"):
                    verify_pv(row, raw, root, ["test", "other"])

    def test_pv_missing_duplicate_and_foreign_queries_refuse(self):
        for queries in [[], pv_fixture()[1]["dependencies"] * 2]:
            row, raw = pv_fixture()
            raw["dependencies"] = queries
            with self.assertRaisesRegex(AssertionError, "scheduled PV query"):
                verify_pv(row, raw, root, ["test", "other"])

    def test_pv_missing_or_mutated_candidate_entry_refuses(self):
        for mode in ["omitted", "entry", "source"]:
            with self.subTest(mode=mode):
                row, raw = pv_fixture()
                if mode == "omitted": raw["result"]["providerPv"] = None
                elif mode == "entry": raw["result"]["providerPv"]["pv"].pop()
                else: raw["dependencies"][0]["receipt"]["result"]["entries"] = []
                with self.assertRaises(AssertionError):
                    verify_pv(row, raw, root, ["test", "other"])

    def test_pv_missing_reordered_duplicate_and_longer_observations_refuse(self):
        for mode in ["missing", "reordered", "duplicate", "longer", "foreign"]:
            with self.subTest(mode=mode):
                row, raw = pv_fixture(2)
                observations = raw["result"]["observations"]
                if mode == "missing": observations.pop()
                elif mode == "reordered": observations.reverse()
                elif mode == "duplicate": observations.append(copy.deepcopy(observations[0]))
                elif mode == "longer": observations[0]["history"].append("b1a3")
                else: observations[0]["targetId"] = "foreign"
                with self.assertRaisesRegex(AssertionError, "scheduled PV population"):
                    verify_pv(row, raw, root, ["test", "other"])

    def test_pv_invented_visits_and_invalid_cap_refuse(self):
        for field, value in [("visited", 1), ("visited", False), ("nodeCap", 0)]:
            with self.subTest(field=field, value=value):
                row, raw = pv_fixture()
                raw["result"][field] = value
                with self.assertRaises(AssertionError):
                    verify_pv(row, raw, root, ["test", "other"])

    def test_resealed_real_pv_cannot_lose_entry_or_cross_root_or_invent_visits(self):
        directory = Path("planning/semantic-consequence-search")
        archive = json.loads(gzip.decompress((directory / "d3262-cost-live-pv-initial-2026-10-06.json.gz").read_bytes()))
        records = json.loads(gzip.decompress(base64.b64decode(archive["groups"][0]["base64"])))
        record = next(r for r in records if r["raw"]["result"]["providerPv"] is not None)
        roots = {r["rootId"]: r for r in json.loads((directory / "d3262-coherent-root-frame.json").read_bytes())["roots"]}
        frame = json.loads((directory / "d3262-coherent-target-comparison-frame.json").read_bytes())
        definitions = {d["id"]: d for d in frame["definitions"]}
        cells = {}
        for comparison in frame["comparisons"]:
            cells.setdefault((comparison["rootId"], comparison["candidateUci"]), []).append(comparison["targetId"])
        source_digest = archive["metadata"]["provider"]["sourceDigest"]
        checker["verify_record"](record, roots, definitions, cells, source_digest)
        for mode, message in [("entry", "PV detached"), ("root", "crossed scheduled PV query"),
                              ("visits", "PV invented traversal visits"), ("fresh_warm", "warm performed fresh source execution")]:
            with self.subTest(mode=mode):
                changed = copy.deepcopy(next(r for r in records if r["row"]["regime"] == "warm") if mode == "fresh_warm" else record)
                if mode == "entry":
                    changed["raw"]["result"]["providerPv"] = None
                elif mode == "root":
                    source = changed["raw"]["dependencies"][0]
                    fields = source["operands"]["fen"].split()
                    fields[-1] = str(int(fields[-1]) + 1)
                    foreign = " ".join(fields)
                    source["operands"]["fen"] = foreign
                    source["receipt"]["operands"]["fen"] = foreign
                    ledger = changed["row"]["providerQueries"][0]
                    ledger["operands"]["fen"] = foreign
                    ledger["receiptDigest"] = checker["digest"](checker["compact"](source["receipt"]))
                elif mode == "visits":
                    changed["raw"]["result"]["visited"] = 1
                else:
                    source = changed["raw"]["dependencies"][0]
                    ledger = changed["row"]["providerQueries"][0]
                    source["state"] = ledger["state"] = "executed"
                    source["receipt"]["started"] = changed["raw"]["clock"]["started"]
                    source["receipt"]["ended"] = changed["raw"]["clock"]["ended"]
                    ledger["receiptDigest"] = checker["digest"](checker["compact"](source["receipt"]))
                    changed["row"]["initialCacheEntries"] = changed["row"]["cacheHits"] = 0
                literal = checker["compact"](changed["raw"])
                changed["row"].update(rawCaptureDigest=checker["digest"](literal), retainedBytes=len(literal))
                with self.assertRaisesRegex(AssertionError, message):
                    checker["verify_record"](changed, roots, definitions, cells, source_digest)

    def test_complete_engine_layers(self):
        row, raw = engine_fixture()
        verify(row, raw, root, {}, ["test"])

    def test_complete_two_four_eight_widths_all_budgets_and_horizons(self):
        for width in [2, 4, 8]:
            for budget in ["depth8", "depth12", "movetime100"]:
                for horizon in [2, 4]:
                    with self.subTest(width=width, budget=budget, horizon=horizon):
                        row, raw = wide_engine_fixture(width, horizon, budget)
                        self.assertEqual(raw["result"]["visited"], width if horizon == 2 else width + width**2 + width**3)
                        verify(row, raw, root, {}, ["test"])

    def test_wide_two_targets_share_queries_without_losing_observations(self):
        for width in [4, 8]:
            with self.subTest(width=width):
                row, raw = wide_engine_fixture(width, targets=("test", "other"))
                single_row, single = wide_engine_fixture(width)
                self.assertEqual(raw["dependencies"], single["dependencies"])
                self.assertEqual(raw["result"]["visited"], 2 * single["result"]["visited"])
                verify(row, raw, root, {}, ["test", "other"])

    def test_wide_legal_trim_with_self_consistent_visit_count_refuses(self):
        for width in [4, 8]:
            with self.subTest(width=width):
                row, raw = wide_engine_fixture(width)
                raw["result"]["observations"].pop()
                raw["result"]["visited"] -= 1
                with self.assertRaisesRegex(AssertionError, "false visited count"):
                    verify(row, raw, root, {}, ["test"])

    def test_wide_rank_order_and_declared_width_cannot_be_changed(self):
        for mode in ["width", "first_order", "deeper_order"]:
            with self.subTest(mode=mode):
                row, raw = wide_engine_fixture(8)
                if mode == "width":
                    row["setting"] = "engine:depth8:top4"
                elif mode == "first_order":
                    raw["result"]["observations"].reverse()
                else:
                    raw["dependencies"][1]["receipt"]["result"]["entries"].reverse()
                with self.assertRaises(AssertionError):
                    verify(row, raw, root, {}, ["test"])

    def test_two_ply_does_not_request_deeper_source(self):
        row, raw = engine_fixture(2)
        verify(row, raw, root, {}, ["test"])

    def test_two_targets_reuse_queries_but_keep_separate_observations(self):
        row, raw = engine_fixture()
        raw["result"]["observations"] += [dict(targetId="other", history=p["history"][:])
                                         for p in raw["result"]["observations"]]
        raw["result"]["visited"] = 6
        verify(row, raw, root, {}, ["test", "other"])

    def test_each_budget_stop_has_exact_counter_and_query_frontier(self):
        for cap in [1, 2, 3]:
            with self.subTest(cap=cap):
                row, raw = engine_fixture(cap=cap)
                verify(row, raw, root, {}, ["test"])

    def test_source_unavailable_retains_no_invented_edges(self):
        row, raw = engine_fixture()
        raw["dependencies"] = raw["dependencies"][:1]
        raw["dependencies"][0]["receipt"] = None
        raw["result"]["observations"] = []
        raw["result"]["visited"] = 0
        verify(row, raw, root, {}, ["test"])

    def test_later_failed_source_retains_earlier_witness(self):
        row, raw = engine_fixture()
        raw["dependencies"] = raw["dependencies"][:2]
        raw["dependencies"][1]["receipt"] = None
        raw["result"]["observations"] = raw["result"]["observations"][:1]
        raw["result"]["visited"] = 1
        verify(row, raw, root, {}, ["test"])

    def test_no_target_has_no_queries_or_visits(self):
        row, raw = engine_fixture()
        raw["dependencies"] = []
        raw["result"].update(observations=[], visited=0)
        verify(row, raw, root, {}, [])

    def test_absorbing_candidate_has_no_source_or_continuation(self):
        row, raw = engine_fixture()
        row["candidateUci"] = "g6g7"
        raw["dependencies"] = []
        raw["result"].update(observations=[], visited=0)
        verify(row, raw, "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", {}, ["test"])

    def test_first_engine_replies_follow_canonical_order_not_source_rank_order(self):
        row, raw = engine_fixture(2)
        raw["dependencies"][0]["receipt"]["result"]["entries"] = [dict(moveUci="e7e5"), dict(moveUci="a7a6")]
        raw["result"].update(visited=2, observations=[dict(targetId="test", history=["e2e4", p]) for p in ["a7a6", "e7e5"]])
        verify(row, raw, root, {}, ["test"])

    def test_exact_two_ply_is_all_legal_replies_without_provider(self):
        row, raw = engine_fixture(2)
        row["setting"] = "forcing:square_control"
        board = checker["board_at"](root, ["e2e4"])
        paths = [["e2e4", m.uci()] for m in sorted(board.legal_moves, key=lambda m: m.uci())]
        raw["dependencies"] = []
        raw["result"].update(visited=len(paths), observations=[dict(targetId="test", history=p) for p in paths])
        verify(row, raw, root, {}, ["test"])

    def test_complete_four_ply_diagnostic_records_availability_not_fourth_execution(self):
        row, raw = engine_fixture()
        row["setting"] = "complete:four-ply"
        candidate = checker["board_at"](root, ["e2e4"])
        paths = []
        for move in sorted(candidate.legal_moves, key=lambda m: m.uci()):
            second = ["e2e4", move.uci()]
            paths.append(second)
            board = checker["board_at"](root, second)
            paths.extend(second + [d.uci()] for d in sorted(board.legal_moves, key=lambda m: m.uci()))
        raw["dependencies"] = []
        raw["result"].update(visited=len(paths), observations=[dict(targetId="test", history=p) for p in paths])
        verify(row, raw, root, {}, ["test"])
        self.assertEqual(max(len(p) for p in paths), 3)

    def test_new_square_control_does_not_become_enemy_piece_trigger(self):
        board = chess.Board("4k3/5p2/8/8/8/8/8/4K2R b - - 0 1")
        definition = dict(family="destination", target=dict(square="e4"))
        move = chess.Move.from_uci("f7f5")
        self.assertTrue(checker["forcing_expands"](board, move, definition, "square_control"))
        self.assertFalse(checker["forcing_expands"](board, move, definition, "enemy_piece"))

    def test_enemy_piece_trigger_requires_the_declared_piece_at_the_square(self):
        board = chess.Board("4k3/5p2/8/8/4B3/8/8/4K2R b - - 0 1")
        definition = dict(family="material", target=dict(target=dict(square="e4", color="white", role="bishop")))
        move = chess.Move.from_uci("f7f5")
        self.assertTrue(checker["forcing_expands"](board, move, definition, "enemy_piece"))
        definition["target"]["target"]["role"] = "rook"
        self.assertFalse(checker["forcing_expands"](board, move, definition, "enemy_piece"))

    def test_resealed_self_consistent_trimming_still_fails_full_schedule(self):
        row, raw = engine_fixture()
        raw["result"]["observations"].pop()
        raw["result"]["visited"] -= 1
        with self.assertRaisesRegex(AssertionError, "false visited count"):
            verify(row, raw, root, {}, ["test"])

    def test_missing_or_foreign_scheduled_queries_refuse(self):
        for mode in ["missing", "foreign", "budget", "rank_width", "reordered"]:
            with self.subTest(mode=mode):
                row, raw = engine_fixture()
                if mode == "missing": raw["dependencies"].pop()
                elif mode == "foreign": raw["dependencies"].append(copy.deepcopy(raw["dependencies"][0]))
                elif mode == "budget": raw["dependencies"][1]["operands"]["budget"] = "depth12"
                elif mode == "rank_width": raw["dependencies"][1]["operands"]["multiPv"] = 4
                else: raw["dependencies"].reverse()
                with self.assertRaises(AssertionError):
                    verify(row, raw, root, {}, ["test"])

    def test_missing_reordered_duplicate_and_unvisited_observations_refuse(self):
        for mode in ["missing", "reordered", "duplicate", "unvisited"]:
            with self.subTest(mode=mode):
                row, raw = engine_fixture()
                observations = raw["result"]["observations"]
                if mode == "missing": observations.pop()
                elif mode == "reordered": observations.reverse()
                elif mode == "duplicate": observations.append(copy.deepcopy(observations[0]))
                else: observations[-1]["history"][-1] = "b7b6"
                with self.assertRaisesRegex(AssertionError, "scheduled engine/exact population"):
                    verify(row, raw, root, {}, ["test"])


if __name__ == "__main__":
    unittest.main()
