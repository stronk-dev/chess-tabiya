import runpy
import unittest
from pathlib import Path

CHECK = runpy.run_path(str(Path(__file__).with_name("coherent-recursive-semantic-check.py")))


class RecursiveBoundaries(unittest.TestCase):
    def test_unranked_event_and_cardinality(self):
        result = CHECK["reserve"](list("abcdefghi"), list("abcdefgh"), ["i"], 2)
        self.assertEqual(result["selected"], ["a", "i"])
        self.assertEqual(result["eventOrderAuthority"], "canonical_uci_unranked_tie_not_engine_rank")
        with self.assertRaises(AssertionError):
            CHECK["reserve"](["a", "b"], ["a"], [], 2)

    def test_ep_capture_and_promoted_identity(self):
        piece = lambda color, role, square: dict(color=color, role=role, square=square)
        definition = dict(family="material", target=dict(attacker=piece("black", "pawn", "d4"), target=piece("white", "pawn", "e2")))
        events = CHECK["event_node"]("7k/8/8/8/3p4/8/4P3/K7 w - - 0 1", ["a1a2", "h8g8", "e2e4"], definition)
        self.assertIn("d4e3", [e["uci"] for e in events["events"]])
        promotion = dict(family="material", target=dict(attacker=piece("white", "pawn", "b7"), target=piece("black", "king", "h8")))
        _, target = CHECK["tracking"]("7k/1P6/8/8/8/8/8/K7 w - - 0 1", ["a1a2", "h8g8", "b7b8q"], promotion)
        self.assertEqual(target["attacker"]["role"], "queen")

    def test_no_boolean_numeric_equivalence(self):
        self.assertFalse(CHECK["same_json"]({"identityAlive": True}, {"identityAlive": 1}))


if __name__ == "__main__":
    unittest.main()
