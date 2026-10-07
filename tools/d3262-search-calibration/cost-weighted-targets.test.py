"""Synthetic independent algebra/custody controls; no source or chess claim."""
import copy
import runpy
import unittest
from pathlib import Path

reader = runpy.run_path(str(Path(__file__).with_name("cost-weighted-targets-check.py")))
project = reader["contributions"]
equal = reader["equal"]
bind = reader["bind"]
live = reader["live_mass"]
path_id = reader["history_id"]


def events():
    return ([dict(id="p", mass=.4, opportunity=True, reintroduced=True),
             dict(id="q", mass=.2, opportunity=False, reintroduced=False)],
            [dict(id="a", predecessorId="p", mass=.1, executed=True),
             dict(id="b", predecessorId="p", mass=.2, executed=False),
             dict(id="c", predecessorId="q", mass=.15, executed=False)])


class Independent(unittest.TestCase):
    def test_declared_binary64_order_not_python_compensated_sum(self):
        self.assertEqual(reader["literal_sum"]([.1, .2, .3]), (.1 + .2) + .3)
        parents = [dict(id=k, mass=m, opportunity=True, reintroduced=True) for k, m in zip("abc", [.1, .2, .3])]
        self.assertEqual(project("removed", parents, [])["opportunityMass"], .6000000000000001)

    def test_predecessor_counted_once_with_executing_and_nonexecuting_leaves(self):
        parents, leaves = events()
        value = project("removed", parents, leaves)
        self.assertEqual(value["opportunityMass"], .4)
        self.assertEqual(value["executionMass"], .1)
        self.assertEqual(value["reintroducedOpportunityMass"], .4)
        self.assertEqual(value["executedLeaves"], ["a"])

    def test_shared_policy_different_target_masks_stay_separate(self):
        parents, leaves = events()
        before = project("removed", parents, leaves)
        parents[0].update(opportunity=False, reintroduced=False)
        parents[1].update(opportunity=True, reintroduced=True)
        leaves[0]["executed"] = False
        leaves[2]["executed"] = True
        after = project("removed", parents, leaves)
        self.assertEqual(before["opportunityMass"], .4)
        self.assertEqual(after["opportunityMass"], .2)
        self.assertEqual(after["executionMass"], .15)

    def test_preserved_and_empty_terminal_events_do_not_invent_reintroduction(self):
        parents, leaves = events()
        parents[0]["reintroduced"] = False
        self.assertEqual(project("preserved", parents, leaves)["reintroducedOpportunityMass"], 0)
        result = project("removed", [], [])
        self.assertEqual(result["opportunityMass"], 0)
        self.assertEqual(result["opportunityPaths"], [])

    def test_json_value_comparison_does_not_launder_false_into_zero_or_unknown(self):
        for a, b in [(False, 0), (True, 1), (None, 0), (None, False),
                     ({"mass": False}, {"mass": 0}), ({"mass": 0}, {"mass": None})]:
            self.assertFalse(equal(a, b))
        self.assertTrue(equal({"mass": 0}, {"mass": 0.0}))
        self.assertFalse(equal({"mass": 0, "grade": "good"}, {"mass": 0}))

    def test_invalid_event_variants(self):
        variants = [
            lambda p, l: p.append(p[0]),
            lambda p, l: l.append(l[0]),
            lambda p, l: l[0].update(predecessorId="foreign"),
            lambda p, l: l[2].update(executed=True),
            lambda p, l: p[1].update(reintroduced=True),
            lambda p, l: p[0].update(opportunity=1),
            lambda p, l: l[0].update(executed=1),
            lambda p, l: p[0].update(mass=False),
            lambda p, l: l[0].update(mass=".1"),
            lambda p, l: l[0].update(mass=float("nan")),
            lambda p, l: l[0].update(mass=-.1),
            lambda p, l: l[0].update(mass=.5),
            lambda p, l: l[1].update(mass=.4),
            lambda p, l: p[0].update(mass=1.1),
        ]
        for mutate in variants:
            with self.subTest(mutate=mutate):
                p, l = events()
                mutate(p, l)
                with self.assertRaises((AssertionError, KeyError, TypeError)):
                    project("removed", p, l)

    def test_policy_identity_and_weight_binding(self):
        p, l = events()
        weights = [dict(pathId=e["id"], plies=3, jointMass=e["mass"]) for e in p]
        weights += [dict(pathId=e["id"], plies=4, jointMass=e["mass"]) for e in l]
        bind(weights, p, l)
        for change in [lambda w: w.pop(), lambda w: w.append(w[0]),
                       lambda w: w[0].update(pathId="foreign"), lambda w: w[0].update(jointMass=.9)]:
            bad = copy.deepcopy(weights)
            change(bad)
            with self.assertRaises(AssertionError):
                bind(bad, p, l)

    def test_original_conditional_products_bind_the_prior_policy_weights(self):
        histories = [["e2e4"], ["e2e4", "e7e5"], ["e2e4", "e7e5", "g1f3"]]
        selected = ["e7e5", "g1f3", "b8c6"]
        conditional, joint, parents = [.8, .5, .25], [.8, .4, .1], [1, .8, .4]
        frontier = {"coverage": {"complete": True}, "nodes": [
            dict(history=h, state="executed", parentJointMass=p, selected=[dict(legalUci=u, mass=m)])
            for h, p, u, m in zip(histories, parents, selected, conditional)], "edges": [
            dict(history=[*h, u], conditionalMass=c, jointMass=j)
            for h, u, c, j in zip(histories, selected, conditional, joint)]}
        r = {"row": {"rootId": "root", "candidateUci": "e2e4"}, "raw": {"result": {"modelFrontier": frontier}}}
        expected = sorted([dict(pathId=path_id("root", e["history"]), plies=len(e["history"]),
                                conditionalMass=e["conditionalMass"], jointMass=e["jointMass"])
                           for e in frontier["edges"]], key=lambda e: e["pathId"])
        reader["actual_policy_weights"](r, expected)
        for change in [lambda f: f["edges"][0].update(jointMass=.1),
                       lambda f: f["edges"][0].update(conditionalMass=.1),
                       lambda f: f["nodes"][0].update(parentJointMass=.9),
                       lambda f: f["edges"][0]["history"].__setitem__(0, "foreign"),
                       lambda f: f["coverage"].update(complete=False)]:
            bad = copy.deepcopy(r)
            change(bad["raw"]["result"]["modelFrontier"])
            with self.assertRaises((AssertionError, KeyError)):
                reader["actual_policy_weights"](bad, expected)

    def test_actual_parent_actions_and_execution_witness(self):
        histories = [["e2e4", "e7e5"], ["e2e4", "e7e5", "g1f3"], ["e2e4", "e7e5", "g1f3", "b8c6"]]
        weights = [dict(pathId=path_id("root", h), plies=len(h), jointMass=m) for h, m in zip(histories, [.8, .4, .1])]
        observations = []
        for h in histories:
            executed = len(h) == 4
            observations.append(dict(targetId="target", history=h, observation={
                "convention": "d3262-target-opportunity@2", "immediate": "removed",
                "opportunityAtThirdPly": len(h) >= 3, "reintroducedAtThirdPly": len(h) >= 3,
                "executedAtFourthPly": executed, "executionWitness": h if executed else None,
                "snapshots": [{}, {}, {"availableActions": [{"uci": "b8c6"}]}][:len(h)] + ([{}] if len(h) == 4 else [])}))
        r = {"row": {"rootId": "root", "candidateUci": "e2e4"}, "raw": {"result": {
            "projections": [{"targetId": "target", "convention": "d3262-target-opportunity@2", "immediate": "removed"}],
            "observations": observations}}}
        self.assertEqual(live(r, "target", weights)["executionMass"], .1)
        for change in [lambda x: x["raw"]["result"]["observations"].pop(),
                       lambda x: x["raw"]["result"]["observations"][0]["observation"].update(opportunityAtThirdPly=0),
                       lambda x: x["raw"]["result"]["observations"][-1]["observation"].update(executionWitness=histories[1]),
                       lambda x: x["raw"]["result"]["observations"][-1]["observation"]["snapshots"][2]["availableActions"].append({"uci": "g8f6"})]:
            bad = copy.deepcopy(r)
            change(bad)
            with self.assertRaises((AssertionError, KeyError)):
                live(bad, "target", weights)


if __name__ == "__main__":
    unittest.main()
