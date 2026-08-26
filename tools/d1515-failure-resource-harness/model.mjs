const NODES_PER_ACT = 3;
const ACTS = 3;
const NODE_COUNT = NODES_PER_ACT * ACTS;

function outcomesFromMask(mask) {
  return Array.from({ length: NODE_COUNT }, (_, index) => (mask & (1 << index)) === 0 ? "achieved" : "failed");
}

function allOutcomeSequences() {
  return Array.from({ length: 1 << NODE_COUNT }, (_, mask) => outcomesFromMask(mask));
}

function directGlobalHp(outcomes) {
  let hp = 3;
  let terminalAt = null;
  for (let index = 0; index < outcomes.length; index += 1) {
    if (outcomes[index] === "failed") hp -= 1;
    if (hp === 0) {
      terminalAt = index;
      break;
    }
  }
  return {
    terminalAt,
    act3Capacity: hp,
    failureDebitAuthority: "failed_verdict",
    newNumericCurrency: true,
    recoveryDependsOnWinning: false,
    unconsequencedFailures: 0,
  };
}

function directActHp(outcomes) {
  let hp = 2;
  let terminalAt = null;
  let act3Capacity = 2;
  for (let index = 0; index < outcomes.length; index += 1) {
    if (index > 0 && index % NODES_PER_ACT === 0) hp = 2;
    if (outcomes[index] === "failed") hp -= 1;
    if (index >= 2 * NODES_PER_ACT) act3Capacity = hp;
    if (hp === 0) {
      terminalAt = index;
      break;
    }
  }
  return {
    terminalAt,
    act3Capacity,
    failureDebitAuthority: "failed_verdict",
    newNumericCurrency: true,
    recoveryDependsOnWinning: false,
    unconsequencedFailures: 0,
  };
}

function sharedChargeResistance(outcomes) {
  let charges = 3;
  let unconsequencedFailures = 0;
  let carriedConstraints = 0;
  let act3Capacity = charges;
  for (let index = 0; index < outcomes.length; index += 1) {
    if (index > 0 && index % NODES_PER_ACT === 0) charges += 1;
    if (outcomes[index] === "failed") {
      if (charges > 0) charges -= 1;
      else carriedConstraints += 1;
    }
    if (index >= 2 * NODES_PER_ACT) act3Capacity = charges;
  }
  return {
    terminalAt: null,
    act3Capacity,
    failureDebitAuthority: "learner_resistance_choice",
    newNumericCurrency: false,
    recoveryDependsOnWinning: false,
    unconsequencedFailures,
    carriedConstraints,
  };
}

function inventoryExhaustion(outcomes) {
  let ready = new Set(["sight_on_request"]);
  const owned = new Set(ready);
  let unconsequencedFailures = 0;
  let carriedConstraints = 0;
  let act3Capacity = ready.size;
  for (let index = 0; index < outcomes.length; index += 1) {
    if (index > 0 && index % NODES_PER_ACT === 0) ready = new Set(owned);
    if (outcomes[index] === "failed") {
      const exhausted = ready.values().next().value;
      if (exhausted === undefined) carriedConstraints += 1;
      else ready.delete(exhausted);
    }
    const unlocked = `module-${index + 1}`;
    owned.add(unlocked);
    ready.add(unlocked);
    if (index >= 2 * NODES_PER_ACT) act3Capacity = ready.size;
  }
  return {
    terminalAt: null,
    act3Capacity,
    failureDebitAuthority: "learner_exhaustion_choice",
    newNumericCurrency: false,
    recoveryDependsOnWinning: false,
    unconsequencedFailures,
    carriedConstraints,
  };
}

export const POLICIES = Object.freeze({
  direct_global_hp: directGlobalHp,
  direct_act_hp: directActHp,
  shared_charge_resistance: sharedChargeResistance,
  inventory_exhaustion: inventoryExhaustion,
});

export function evaluatePolicies() {
  const sequences = allOutcomeSequences();
  const baseline = outcomesFromMask(0);
  const earlyFailure = outcomesFromMask(1);
  return Object.fromEntries(Object.entries(POLICIES).map(([id, policy]) => {
    const results = sequences.map(policy);
    const completed = results.filter((result) => result.terminalAt === null).length;
    const singleFailures = sequences.filter((outcomes) => outcomes.filter((value) => value === "failed").length === 1);
    const singleFailureTerminations = singleFailures.filter((outcomes) => policy(outcomes).terminalAt !== null).length;
    return [id, Object.freeze({
      sequences: sequences.length,
      completed,
      terminated: sequences.length - completed,
      singleFailureTerminations,
      act1FailureChangesAct3Capacity: policy(baseline).act3Capacity !== policy(earlyFailure).act3Capacity,
      failureDebitAuthority: results[0].failureDebitAuthority,
      newNumericCurrency: results[0].newNumericCurrency,
      recoveryDependsOnWinning: results[0].recoveryDependsOnWinning,
      unconsequencedFailures: results.reduce((sum, result) => sum + result.unconsequencedFailures, 0),
    })];
  }));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  process.stdout.write(`${JSON.stringify(evaluatePolicies(), null, 2)}\n`);
}
