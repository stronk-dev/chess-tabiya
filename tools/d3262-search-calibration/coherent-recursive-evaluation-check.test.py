"""Independent bounded-algebra/type controls, synthetic not chess sources."""
import runpy
import unittest
from pathlib import Path

helpers = runpy.run_path(str(Path(__file__).with_name("coherent-recursive-evaluation-check.py")))


class RecursiveBoundary(unittest.TestCase):
    def test_missing_defences_and_sibling_preparations_do_not_prove_survival(self):
        result = helpers["preparation_result"](["a", "b"], None,
            [dict(learnerUci="a", opportunity=True, pathId="actual", executedLeaves=["leaf"])])
        self.assertEqual(result["availability"], "unknown_partial_defences")
        self.assertEqual(helpers["root_result"]("removed", ["x", "y"],
            [dict(preparationUci="x", **result)])["availability"], "unknown_partial_quantifiers")

    def test_terminals_are_not_vacuous_universals(self):
        result = helpers["preparation_result"](["a"], "INSUFFICIENT_MATERIAL", [])
        self.assertEqual(result["availability"], "ineligible_terminal")
        self.assertEqual(result["unexpandedTerminalLegalMoves"], 1)

    def test_partial_contrast_and_numeric_booleans_cannot_create_proof(self):
        r = helpers["compare_arms"](dict(opportunity=True, execution=False), dict(opportunity=False, execution=False), "same")
        self.assertIsNone(r["certifiedOpportunity"])
        self.assertTrue(r["apparentOnExactSame"])
        with self.assertRaisesRegex(AssertionError, "mismatch"):
            helpers["verify"]({"count": True}, {"count": 1})


if __name__ == "__main__":
    unittest.main()
