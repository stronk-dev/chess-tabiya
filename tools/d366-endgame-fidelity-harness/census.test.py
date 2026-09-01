#!/usr/bin/env python3
"""Able-to-fail unit controls for the corrected D457 census."""

import importlib.util
import pathlib
import unittest


MODULE_PATH = pathlib.Path(__file__).with_name("census.py")
SPEC = importlib.util.spec_from_file_location("d457_census", MODULE_PATH)
CENSUS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CENSUS)


class DtzOrderingTest(unittest.TestCase):
    def test_precise_dtz_breaks_a_rounded_dtz_tie(self):
        row = {
            "fen": "8/8/8/8/8/8/1K6/7k w - - 0 1",
            "category": "win",
            "resultClass": "win",
            "moves": [
                {"uci": "b2a2", "moverClass": "win", "dtz": 1, "preciseDtz": 1.9},
                {"uci": "b2c2", "moverClass": "win", "dtz": 1, "preciseDtz": 1.1},
            ],
        }
        self.assertEqual(CENSUS.ordered_preserving(row)[0]["uci"], "b2c2")

    def test_rounded_dtz_is_only_the_explicit_null_fallback(self):
        row = {
            "fen": "8/8/8/8/8/8/1K6/7k w - - 0 1",
            "category": "loss",
            "resultClass": "loss",
            "moves": [
                {"uci": "b2a2", "moverClass": "loss", "dtz": -9, "preciseDtz": None},
                {"uci": "b2c2", "moverClass": "loss", "dtz": -3, "preciseDtz": None},
            ],
        }
        self.assertEqual(CENSUS.ordered_preserving(row)[0]["uci"], "b2a2")

    def test_poisson_binomial_tail_uses_each_positions_own_null_probability(self):
        self.assertAlmostEqual(CENSUS.poisson_binomial_upper_tail([0.5, 0.5], 2), 0.25)

    def test_winning_order_keeps_the_hash_after_precise_dtz_only(self):
        row = {
            "fen": "8/8/8/8/8/8/1K6/7k w - - 0 1",
            "category": "win",
            "resultClass": "win",
            "moves": [
                {"uci": "b2a2", "moverClass": "win", "dtz": 1, "preciseDtz": 1.0},
                {"uci": "b2c2", "moverClass": "win", "dtz": 1, "preciseDtz": 2.0},
            ],
        }
        self.assertEqual(CENSUS.ordered_preserving(row)[0]["uci"], "b2a2")


if __name__ == "__main__":
    unittest.main()
