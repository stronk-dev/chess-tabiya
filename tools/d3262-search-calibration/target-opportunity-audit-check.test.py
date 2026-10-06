import runpy
import unittest
from pathlib import Path

import chess

h = runpy.run_path(str(Path(__file__).with_name("target-opportunity-audit-check.py")))


def piece(color, role, square):
    return dict(color=color, role=role, square=square)


class OpportunityV2(unittest.TestCase):
    def test_ep_captured_and_landing_squares(self):
        s = dict(fen="4k3/8/8/8/3pP3/8/8/4K3 b - e3 0 1", terminalReason=None,
                 tracked=dict(kind="material", attacker=piece("black", "pawn", "d4"), target=piece("white", "pawn", "e4")))
        actions = h["actions"](s)
        self.assertEqual([(a["uci"], a["capturedSquare"], a["landingSquare"], a["resultUnits"]) for a in actions], [("d4e3", "e4", "e3", 1)])

    def test_plural_promotions_and_values(self):
        s = dict(fen="4k3/8/8/8/8/8/1p3K2/R7 b - - 1 1", terminalReason=None,
                 tracked=dict(kind="material", attacker=piece("black", "pawn", "b2"), target=piece("white", "rook", "a1")))
        self.assertEqual([(a["uci"], a["resultUnits"]) for a in h["actions"](s)], [("b2a1b", 7), ("b2a1n", 7), ("b2a1q", 13), ("b2a1r", 9)])

    def test_pinned_ep_is_not_legal(self):
        s = dict(fen="3k4/8/8/8/3pP3/8/8/3RK3 b - e3 0 1", terminalReason=None,
                 tracked=dict(kind="material", attacker=piece("black", "pawn", "d4"), target=piece("white", "pawn", "e4")))
        self.assertEqual(h["actions"](s), [])

    def test_equal_exchange_is_not_positive(self):
        b = chess.Board("4k3/8/8/8/3p4/4P3/5P2/4K3 b - - 0 1")
        self.assertEqual(h["exchange"](b, chess.Move.from_uci("d4e3")), 0)
        ep = chess.Board("4k3/8/8/8/3pP3/8/5B2/4K3 b - e3 0 1")
        self.assertEqual(h["exchange"](ep, chess.Move.from_uci("d4e3")), 0)

    def test_typed_comparison_rejects_boolean_ordinal(self):
        with self.assertRaises(AssertionError):
            h["verify"]({"node": True}, {"node": 1})


if __name__ == "__main__":
    unittest.main()
