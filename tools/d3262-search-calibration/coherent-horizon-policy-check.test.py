import runpy
import unittest
from pathlib import Path

h = runpy.run_path(str(Path(__file__).with_name("coherent-horizon-policy-check.py")))


class BoundaryTests(unittest.TestCase):
    def test_local_threshold_is_not_joint_threshold(self):
        values = h["compose"](0.81, [dict(pathMass=0.81**2, coveredConditionalMass=0.81, terminalReason=None)])
        self.assertEqual(h["stop"](0.8, values[0])["status"], "joint_rule_satisfied")
        self.assertEqual(h["stop"](0.8, values[2], False, 3)["status"], "frozen_frontier_exhausted_below_joint_threshold")

    def test_absorption_and_source_off_never_manufacture_moves_or_zero_mass(self):
        self.assertEqual(h["compose"](0.8, [dict(pathMass=0.6, coveredConditionalMass=1, terminalReason="INSUFFICIENT_MATERIAL")], 0.2), [0.8, 0.8, 0.8])
        self.assertEqual(h["compose"](1, [], 0, True), [1, 1, 1])
        self.assertIsNone(h["stop"](0.8, None, True)["coveredJointMass"])
        with self.assertRaises(AssertionError):
            h["stop"](0.8, 0, True)

    def test_float32_support_is_preserved_and_boundary_abstains(self):
        self.assertEqual(h["stop"](0.9, 1.0000000968575478)["coveredJointMass"], 1.0000000968575478)
        self.assertEqual(h["stop"](0.8, 0.8)["status"], "numerical_boundary_abstain")
        with self.assertRaises(AssertionError):
            h["stop"](0.8, 1.1)

    def test_two_ply_named_execution_is_not_a_four_ply_opportunity(self):
        d = dict(family="material", target=dict(attacker=dict(color="black", role="pawn", square="b2"),
                                               target=dict(color="white", role="rook", square="a1")))
        history, observation = h["pv_observation"]("4k3/8/8/8/8/8/1p2K3/R7 w - - 0 1", "e2f2", ["e2f2", "b2a1n"], d)
        self.assertEqual(len(observation["snapshots"]), 2)
        self.assertIn(history[1], [a["uci"] for a in observation["snapshots"][0]["availableActions"]])
        self.assertFalse(observation["opportunityAtThirdPly"])
        self.assertFalse(observation["executedAtFourthPly"])


if __name__ == "__main__":
    unittest.main()
