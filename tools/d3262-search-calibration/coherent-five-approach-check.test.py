import runpy
import unittest
from pathlib import Path

helpers = runpy.run_path(str(Path(__file__).with_name("coherent-five-approach-check.py")))


class BoundaryTests(unittest.TestCase):
    def test_partial_refutation_is_not_absence(self):
        p = dict(availability="refuted_by_visited_defence", unvisitedDefences=[], observed=[dict(opportunity=False), dict(opportunity=True)])
        self.assertIs(helpers["knowledge"]("removed", [p], [], "engine_beam"), True)
        p["observed"] = [dict(opportunity=False)]
        self.assertIsNone(helpers["knowledge"]("removed", [p], ["omitted"], "engine_beam"))
        self.assertIs(helpers["knowledge"]("removed", [p], [], "engine_beam"), False)
        self.assertIsNone(helpers["knowledge"]("removed", [p], [], "provider_line"))

    def test_source_ceiling_withholds_universal(self):
        for raw in ["exists_preparation_surviving_all_defences", "every_preparation_refuted_at_bound"]:
            self.assertEqual(helpers["licensed"](raw, "provider_line"), "withheld_provider_line_ceiling")
            self.assertEqual(helpers["licensed"](raw, "exact_reply_forcing"), raw)

    def test_actual_pv_plural_promotion_execution_and_ep(self):
        piece = lambda color, role, square: dict(color=color, role=role, square=square)
        d = dict(family="material", target=dict(attacker=piece("black", "pawn", "b2"), target=piece("white", "rook", "a1")))
        for promotion in "bnqr":
            history = ["e2f2", "e8d8", "f2g2", "b2a1" + promotion]
            actual, observation = helpers["pv_observation"]("4k3/8/8/8/8/8/1p2K3/R7 w - - 0 1", history[0], history, d)
            self.assertEqual(actual, history)
            self.assertEqual(len(observation["snapshots"][0]["availableActions"]), 4)
            self.assertTrue(observation["executedAtFourthPly"])
        d = dict(family="material", target=dict(attacker=piece("black", "pawn", "d4"), target=piece("white", "pawn", "e2")))
        _, observation = helpers["pv_observation"]("4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1", "e2e4", ["e2e4"], d)
        action = observation["snapshots"][0]["availableActions"][0]
        self.assertEqual((action["capturedSquare"], action["landingSquare"]), ("e4", "e3"))

    def test_capture_of_named_actor_is_removal_not_unrelated_identity_loss(self):
        d = dict(family="material", target=dict(attacker=dict(color="black", role="rook", square="a8"),
                                               target=dict(color="white", role="pawn", square="h2")))
        _, observation = helpers["pv_observation"]("r3k3/8/8/8/8/8/7P/R3K3 w Q - 0 1", "a1a8", ["a1a8"], d)
        self.assertEqual(observation["immediate"], "removed")


if __name__ == "__main__":
    unittest.main()
