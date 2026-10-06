"""Synthetic independent board/history controls, never provider observations."""
import importlib.util
import unittest
from pathlib import Path

import chess

spec = importlib.util.spec_from_file_location("frontier_check", Path(__file__).with_name("coherent-engine-fourth-ply-check.py"))
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class IndependentFrontierControls(unittest.TestCase):
    def test_compact_target_references_reject_boolean_negative_and_out_of_range_indices(self):
        target_spec = importlib.util.spec_from_file_location("target_check", Path(__file__).with_name("coherent-engine-target-check.py"))
        target = importlib.util.module_from_spec(target_spec)
        target_spec.loader.exec_module(target)
        make = lambda index: {"observations": [{}, {}], "profiles": [{"rows": [{"arms": [{"paths": [
            {"predecessorObservation": index, "leafObservations": [1]}]}]}]}]}
        target.check_reference_indices(make(0))
        for index in [True, -1, 2, 0.0, "0"]:
            with self.assertRaises(AssertionError):
                target.check_reference_indices(make(index))

    def test_terminal_with_legal_moves_absorbs_and_mate_has_precedence(self):
        board = chess.Board("7k/8/8/8/3B4/8/8/7K b - - 0 2")
        self.assertGreater(board.legal_moves.count(), 0)
        self.assertEqual(checker.terminal(board), "INSUFFICIENT_MATERIAL")
        self.assertEqual(checker.terminal(chess.Board("7k/6Q1/5K2/8/8/8/8/8 b - - 150 2")), "CHECKMATE")
        self.assertEqual(checker.terminal(chess.Board("7k/8/8/8/8/8/8/R6K b - - 150 2")), "SEVENTYFIVE_MOVES")

    def test_actual_legal_history_and_impossible_ancestor_refuse(self):
        self.assertEqual(checker.replay(chess.STARTING_FEN, ["g1f3", "g8f6", "b1c3"]).fullmove_number, 2)
        with self.assertRaises(AssertionError):
            checker.replay(chess.STARTING_FEN, ["a1a8"])
        with self.assertRaises(AssertionError):
            checker.replay("7k/8/8/8/3B4/8/8/7K b - - 0 2", ["h8g8"])

    def test_same_fen_does_not_collapse_ordered_path_identity(self):
        left, right = ["g1f3", "g8f6", "b1c3"], ["b1c3", "g8f6", "g1f3"]
        self.assertEqual(checker.replay(chess.STARTING_FEN, left).fen(), checker.replay(chess.STARTING_FEN, right).fen())
        self.assertNotEqual(checker.path_id("root", left), checker.path_id("root", right))

    def test_typed_absence_and_missing_field_do_not_equal_the_verified_expected_result(self):
        expected = {"version": 1, "universalVerdict": "not_evaluated", "negativeVerdict": "abstain_partial", "selected": ["g8f6"]}
        checker.verify(dict(expected), expected)
        for bad in [{**expected, "version": True}, {**expected, "universalVerdict": "proven"}, {**expected, "selected": []}, {"selected": ["g8f6"]}]:
            with self.assertRaises(AssertionError):
                checker.verify(bad, expected)


if __name__ == "__main__":
    unittest.main()
