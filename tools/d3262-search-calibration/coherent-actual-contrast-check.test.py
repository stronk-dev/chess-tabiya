"""Synthetic independent contrast-boundary controls, not provider evidence."""
import runpy
import unittest
from pathlib import Path

CHECK = runpy.run_path(str(Path(__file__).with_name("coherent-actual-contrast-check.py")))


class ContrastBoundaries(unittest.TestCase):
    def test_bool_is_not_a_numeric_witness(self):
        self.assertFalse(CHECK["same_json"]({"seen": True}, {"seen": 1}))
        self.assertFalse(CHECK["same_json"]([False], [0]))
        self.assertTrue(CHECK["same_json"]({"mass": 1.0}, {"mass": 1}))
        self.assertFalse(CHECK["same_json"]({"value": None}, {"value": "null"}))

    def test_direction_requires_literal_booleans(self):
        self.assertEqual(CHECK["direction"](True, False), "source_only_opponent_option")
        self.assertEqual(CHECK["direction"](False, True), "alternative_only_opponent_option")
        with self.assertRaisesRegex(AssertionError, "booleans"):
            CHECK["direction"](1, False)

    def test_literal_mass_uses_the_recorded_left_to_right_arithmetic(self):
        self.assertEqual(CHECK["ordered_sum"]([1e16, 1.0, -1e16]), 0.0)
        self.assertEqual(CHECK["ordered_sum"]([]), 0.0)

    def test_compact_references_and_actual_execution_are_separate(self):
        cell = {"rootId": "root", "targetId": "target", "immediate": "removed"}
        observations = [{"rootId": "root", "targetId": "target", "pathId": "three",
                         "observation": {"immediate": "removed", "opportunityAtThirdPly": True, "reintroducedAtThirdPly": True}},
                        {"rootId": "root", "targetId": "target", "pathId": "four",
                         "observation": {"immediate": "removed", "executedAtFourthPly": False}}]
        arm = {"paths": [{"predecessorObservation": 0, "leafObservations": [1]}]}
        result = CHECK["engine_summary"](cell, arm, observations)
        self.assertEqual(result["reintroducedPaths"], ["three"])
        self.assertEqual(result["executedLeaves"], [])
        arm["paths"][0]["predecessorObservation"] = False
        with self.assertRaisesRegex(AssertionError, "compact ordinal"):
            CHECK["engine_summary"](cell, arm, observations)


if __name__ == "__main__":
    unittest.main()
