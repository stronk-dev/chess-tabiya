// Disposable RFC-0000 D3429 research: source-formula counterexamples, not calibration.
// No human/bot rows, score-domain mapping, fitted parameters, metric or verdict executor.
// Regan/Haworth 2011 §3 (printed p4) specifies the implicit proxy mapping below;
// its §6 percentiling description also writes direct normalization. The author must
// resolve that version/method choice. These private toy functions are not an adoption.
import assert from "node:assert/strict";
import test from "node:test";

function checkProxies(proxies) {
  if (!Array.isArray(proxies) || proxies.length === 0 || Math.max(...proxies) !== 1 ||
      proxies.some((y) => typeof y !== "number" || !Number.isFinite(y) || y <= 0 || y > 1)) {
    throw new TypeError("synthetic proxies must be finite in (0,1], with at least one best proxy 1");
  }
}

function implicitMapping(proxies) {
  checkProxies(proxies);
  if (proxies.length === 1) return [1];
  // t = -ln(p0). The sum exp(-t/y_i) is strictly decreasing; [0, ln(n)] brackets 1.
  // Fixed toy bisection depth is NOT the parameter fitter's undeclared tolerance.
  let low = 0;
  let high = Math.log(proxies.length);
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const middle = (low + high) / 2;
    const total = proxies.reduce((sum, y) => sum + Math.exp(-middle / y), 0);
    if (total > 1) low = middle;
    else high = middle;
  }
  const t = (low + high) / 2;
  return proxies.map((y) => Math.exp(-t / y));
}

function directNormalization(proxies) {
  checkProxies(proxies);
  const total = proxies.reduce((sum, y) => sum + y, 0);
  return proxies.map((y) => y / total);
}

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-13, `${actual} differs from ${expected}`);
}

function assertImplicitEquations(proxies, probabilities) {
  close(probabilities.reduce((sum, p) => sum + p, 0), 1);
  const bestProbability = probabilities[proxies.indexOf(1)];
  proxies.forEach((y, index) => close(probabilities[index], bestProbability ** (1 / y)));
}

test("golden-ratio closed form distinguishes implicit conversion from direct normalization", () => {
  const expected = (Math.sqrt(5) - 1) / 2;
  const probabilities = implicitMapping([1, 0.5]);
  close(probabilities[0], expected);
  close(probabilities[1], expected ** 2);
  assertImplicitEquations([1, 0.5], probabilities);
  assert.throws(() => close(directNormalization([1, 0.5])[0], expected));
});

test("a nonuniform three-option case can coincide under both different mappings", () => {
  // p0 + 2*p0^2 = 1 has the positive root p0 = 1/2.
  const proxies = [1, 0.5, 0.5];
  const probabilities = implicitMapping(proxies);
  probabilities.forEach((p, index) => close(p, [0.5, 0.25, 0.25][index]));
  assertImplicitEquations(proxies, probabilities);
  assertImplicitEquations(proxies, directNormalization(proxies));
});

test("four-option closed form is a second independent normalization counterexample", () => {
  // p0 + 3*p0^2 = 1 has the positive root (sqrt(13)-1)/6.
  const proxies = [1, 0.5, 0.5, 0.5];
  const expected = (Math.sqrt(13) - 1) / 6;
  const probabilities = implicitMapping(proxies);
  close(probabilities[0], expected);
  probabilities.slice(1).forEach((p) => close(p, expected ** 2));
  assertImplicitEquations(proxies, probabilities);
  assert.throws(() => assertImplicitEquations(proxies, directNormalization(proxies)));
});

test("equal alternatives are uniform under both maps and cannot distinguish the choice", () => {
  for (const count of [2, 3, 4, 20]) {
    const proxies = Array(count).fill(1);
    for (const mapping of [implicitMapping, directNormalization]) {
      const probabilities = mapping(proxies);
      probabilities.forEach((p) => close(p, 1 / count));
      assertImplicitEquations(proxies, probabilities);
    }
  }
});

test("a one-choice root is certain without using an undefined likelihood parameter fit", () => {
  assert.deepEqual(implicitMapping([1]), [1]);
  assert.deepEqual(directNormalization([1]), [1]);
});

test("permutation changes identities only, not the underlying probabilities", () => {
  const canonical = implicitMapping([1, 0.5, 0.25]);
  const reordered = implicitMapping([0.25, 1, 0.5]);
  reordered.forEach((p, index) => close(p, canonical[[2, 0, 1][index]]));
  assertImplicitEquations([0.25, 1, 0.5], reordered);
});

test("small positive proxies retain finite probabilities and the implicit equations", () => {
  const proxies = [1, 0.5, 1e-100, Number.MIN_VALUE];
  const probabilities = implicitMapping(proxies);
  assert.ok(probabilities.every((p) => Number.isFinite(p) && p >= 0 && p <= 1));
  assertImplicitEquations(proxies, probabilities);
  close(probabilities[0], (Math.sqrt(5) - 1) / 2);
  // Underflow here is observable toy arithmetic, not authority to erase a chosen move.
  assert.deepEqual(probabilities.slice(2), [0, 0]);
});

test("invalid or unanchored proxies refuse rather than inventing score/domain coercion", () => {
  for (const proxies of [[], [0], [0.5], [1, 0], [1, -1], [1, 2], [1, NaN],
    [1, Infinity], [1, "0.5"], null, { 0: 1 }]) {
    for (const mapping of [implicitMapping, directNormalization]) {
      assert.throws(() => mapping(proxies), TypeError);
    }
  }
});

test("uniform zero-regret rows cannot identify sensitivity and consistency by themselves", () => {
  // This uses synthetic zero deltas, not a proposal to include/exclude the 162 priced flat roots.
  for (const [s, c] of [[0.01, 0.5], [1, 1], [100, 2]]) {
    const proxies = [0, 0, 0].map((delta) => Math.exp(-((delta / s) ** c)));
    implicitMapping(proxies).forEach((p) => close(p, 1 / 3));
  }
});
