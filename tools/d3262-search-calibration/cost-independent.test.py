"""Disposable D3262 full-population replay boundary controls."""
import copy
import runpy
import unittest
from pathlib import Path
import chess

checker = runpy.run_path(str(Path(__file__).with_name("cost-independent.py")))
verify = checker["verify_plain_population"]
root = chess.STARTING_FEN


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


class PopulationTests(unittest.TestCase):
    def test_complete_engine_layers(self):
        row, raw = engine_fixture()
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
