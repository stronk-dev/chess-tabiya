"""Typed output comparison boundary, synthetic and never chess evidence."""
import copy
import runpy
import unittest
from pathlib import Path

helpers = runpy.run_path(str(Path(__file__).with_name("coherent-recursive-fourth-check.py")))
verify, leaf = [helpers[n] for n in ["verify_output", "selected_leaf"]]


class CompletionBoundary(unittest.TestCase):
    def test_canonical_fen_keeps_only_a_legally_capturable_en_passant_square(self):
        quiet = leaf("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "root", [], "e2e4")
        self.assertEqual(quiet["fen"].split()[3], "-")
        actual = leaf("4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1", "root", [], "d7d5")
        self.assertEqual(actual["fen"].split()[3], "d6")

    def test_literals_are_not_relabelled_by_boolean_numeric_equality(self):
        expected = {"count": 1, "selected": [{"uci": "e2e4", "omitted": 0}]}
        verify(copy.deepcopy(expected), expected)
        for changed in [{"count": True, "selected": expected["selected"]},
                        {"count": 1, "selected": [{"uci": "e2e4", "omitted": False}]}]:
            with self.assertRaisesRegex(AssertionError, "independent image"):
                verify(changed, expected)

    def test_extra_missing_or_reordered_selections_are_not_equal(self):
        expected = {"selected": ["e2e4", "d2d4"]}
        for changed in [{}, {"selected": ["d2d4", "e2e4"]}, {**expected, "proof": True}]:
            with self.assertRaisesRegex(AssertionError, "independent image"):
                verify(changed, expected)


if __name__ == "__main__":
    unittest.main()
