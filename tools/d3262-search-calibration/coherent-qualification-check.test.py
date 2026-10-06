import runpy
import unittest
import chess
from pathlib import Path
module = runpy.run_path(str(Path(__file__).with_name("coherent-qualification-check.py")))


class QualificationControls(unittest.TestCase):
    def test_exact_board_image_preserves_only_legal_ep(self):
        board = chess.Board()
        board.push_uci("e2e4")
        self.assertEqual(board.fen(en_passant="legal").split()[3], "-")
        self.assertEqual(board.fen(en_passant="fen").split()[3], "e3")
        board = chess.Board("7k/8/8/8/3p4/8/4P3/7K w - - 0 1")
        board.push_uci("e2e4")
        self.assertEqual(board.fen(en_passant="legal").split()[3], "e3")

    def test_rank_tie_and_budget(self):
        a = {"status": "retained", "budget": "depth12", "rank": 1, "depth": 12, "score": {"kind": "cp", "value": 4, "bound": False}}
        b = {**a, "rank": 2}
        result = module["rank_comparison"](a, b)
        self.assertEqual(result["rankOrder"], "source_precedes")
        self.assertEqual(result["cpOrder"], "tie")
        with self.assertRaises(AssertionError):
            module["rank_comparison"](a, {**b, "budget": "depth8"})
        with self.assertRaises(AssertionError):
            module["rank_comparison"](a, {**b, "score": {"kind": "cp", "value": None, "bound": False}})

    def test_mate_not_cp(self):
        a = {"status": "retained", "budget": "depth12", "rank": 1, "depth": 12, "score": {"kind": "mate", "value": 4, "bound": False}}
        self.assertEqual(module["rank_comparison"](a, {**a, "rank": 2})["cpOrder"], "not_comparable_as_cp")

    def test_partial_and_line_cannot_prove_universal(self):
        replies = [{"uci": "a1a2", "retainsAny": True}, {"uci": "b1b2", "retainsAny": False}]
        self.assertEqual(module["selected_verdict"](replies, ["a1a2"])["verdict"], "unknown_unvisited_or_provider_line_ceiling")
        self.assertEqual(module["selected_verdict"](replies, ["b1b2"])["refutations"], ["b1b2"])
        self.assertEqual(module["selected_verdict"](replies[:1], ["a1a2"], True)["verdict"], "unknown_unvisited_or_provider_line_ceiling")
        with self.assertRaises(AssertionError):
            module["selected_verdict"]([], [])


if __name__ == "__main__":
    unittest.main()
