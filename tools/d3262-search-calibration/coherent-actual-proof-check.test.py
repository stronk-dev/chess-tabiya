"""Independent quantifier algebra boundary controls; not provider evidence."""
import runpy
import unittest
from pathlib import Path

CHECK = runpy.run_path(str(Path(__file__).with_name("coherent-actual-proof-check.py")))
prep = CHECK["preparation_result"]
root = CHECK["root_result"]


def observed(uci, opportunity, execute=False):
    return dict(learnerUci=uci, pathId=f"path:{uci}", opportunity=opportunity, executedLeaves=["leaf"] if execute else [])


class ProofBoundaries(unittest.TestCase):
    def test_partial_refutation_and_nonvacuous_positive(self):
        self.assertEqual(prep(["a", "b"], None, [observed("a", False)])["availability"], "refuted_by_visited_defence")
        self.assertEqual(prep(["a", "b"], None, [observed("a", True)])["availability"], "unknown_partial_defences")
        full = prep(["a"], None, [observed("a", True)])
        self.assertEqual(full["availability"], "survives_complete_nonempty_defences")
        self.assertEqual(full["execution"], "unknown_unexecuted_or_partial")
        self.assertEqual(prep(["a"], None, [observed("a", True, True)])["execution"], "executed_against_every_defence")

    def test_root_negative_requires_every_preparation(self):
        negative = dict(preparationUci="x", **prep(["a", "b"], None, [observed("a", False)]))
        self.assertEqual(root("removed", ["x", "y"], [negative])["availability"], "unknown_partial_quantifiers")
        self.assertEqual(root("removed", ["x"], [negative])["availability"], "every_preparation_refuted_at_bound")
        self.assertEqual(root("preserved", ["x"], [negative])["availability"], "not_applicable_immediate_preserved")

    def test_terminal_is_not_vacuous_truth(self):
        result = prep(["a"], "INSUFFICIENT_MATERIAL", [])
        self.assertEqual(result["availability"], "ineligible_terminal")
        self.assertEqual(result["unexpandedTerminalLegalMoves"], 1)
        with self.assertRaisesRegex(AssertionError, "terminal"):
            prep(["a"], "INSUFFICIENT_MATERIAL", [observed("a", True)])

    def test_untyped_or_illegal_witness_refuses(self):
        for bad in [observed("a", 1), observed("b", True), observed("a", False, True)]:
            with self.assertRaises(AssertionError):
                prep(["a"], None, [bad])
        self.assertFalse(CHECK["same_json"]({"opportunity": True}, {"opportunity": 1}))


if __name__ == "__main__":
    unittest.main()
