import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/campaign-core.md", "utf8");
const register = readFileSync("rfc/README.md", "utf8");
const normative = rfc.split("\n## Changelog\n", 1)[0];
const includesAll = (text, fragments) => fragments.forEach((fragment) => assert.match(text, fragment));

test("D2077-D2086 repair remains draft and implementation-refused", () => {
  includesAll(rfc, [/D2077.*D2086.*author repair/su, /fresh\s+independent\s+review\s+required/iu,
    /No campaign\s+schema, migration, production route, official\s+campaign or surface may resume/u]);
});

test("all three versioned claims are registered once", () => {
  assert.equal((rfc.match(/campaign-schema \| lane 2 \|/gu) ?? []).length, 1);
  assert.equal((rfc.match(/run-schema \| lane 0\.25 \|/gu) ?? []).length, 1);
  assert.match(rfc, /migration \| position behind bot-policy \| campaign_runs; campaign_run_creations; campaign_events; campaign_reward_awards/u);
  assert.match(register, /\| lane 2 \| `campaign-core\.md` \|/u);
});

test("D2077 terminal submit is one indivisible event and transaction", () => {
  includesAll(normative, [/interface NodeCommittedEvent/u, /kind: "node_committed"/u,
    /there are no trailing events/u, /same database\s+transaction.*single event.*materialized status/su,
    /Injected failure.*rolls back all effects/su, /concurrent or\s+response-loss retry/u]);
  assert.doesNotMatch(normative, /appends\s+`node_sealed[\s\S]{0,300}appends.*`charge_earned/u);
});

test("D2078 module loadout has a durable typed mutation", () => {
  includesAll(normative, [/`loadout_changed \{ equippedModuleIds \}`/u,
    /PUT \/campaign-runs\/:campaignRunId\/loadout/u, /supports both equip and\s+unequip/u,
    /CAMPAIGN_LOADOUT_FAMILY_INVALID/u, /Preset changes append no campaign event/u]);
});

test("D2079 exact campaign bytes survive replay and restore", () => {
  includesAll(normative, [/campaign_document_digest TEXT NOT NULL/u, /campaign_document TEXT NOT NULL/u,
    /keys by `\{id,version,digest\}`/u, /CAMPAIGN_DOCUMENT_VERSION_MUTATED/u,
    /Removing a document.*does not make an existing run\s+unreplayable/su,
    /restore refuses a digest mismatch/u]);
});

test("D2080 resource rewards enter a source-identified charge ledger", () => {
  includesAll(normative, [/`reward_grant \{ nodeId, rewardIdentity, amount \}`/u,
    /starting \+ act-seal income \+ source-identified reward income − spent/u,
    /two rewards for the same\s+resource but different node\/reward identities both count/u,
    /rewardIncome/u]);
});

test("D2081 consumer closure serializes behind exact producers", () => {
  includesAll(normative, [/pack-capability-contract\.md/u, /theory-drill-current-joins\.md/u,
    /derivePackCapabilityRequirements/u, /compileApplicabilityResult/u,
    /CAMPAIGN_CONSUMER_AUTHORITY_UNAVAILABLE/u, /never substitutes a\s+campaign-local graph/u]);
});

test("D2082 reward families have different projections", () => {
  includesAll(normative, [/ModuleInventoryProjection/u, /TheoryInventoryProjection/u,
    /ResourceLedgerProjection/u, /Only modules are equipable/u,
    /authorizing_module_inactive/u, /disclosure_ceiling/u]);
  assert.doesNotMatch(normative, /For each owned module or theory item/u);
});

test("D2083 campaign origin is a real run-schema claim", () => {
  includesAll(normative, [/run-schema \| lane 0\.25/u, /type RunOrigin/u,
    /campaignDocumentDigest/u, /written in `run\.started`/u,
    /campaign_history_unavailable/u, /Plain runs\s+carry no origin and infer none/u]);
});

test("D2084 complete API has ownership, revisions, idempotency and typed errors", () => {
  const operations = [...normative.matchAll(/`(?:GET|POST|PUT) \/(?:campaigns|campaign-runs|campaign-rewards)[^`]*`/gu)];
  assert.ok(operations.length >= 11);
  includesAll(normative, [/Every route resolves learner identity from authentication/u,
    /Every mutation uses §6\.0's durable\s+command identity/u, /CAMPAIGN_REVISION_STALE/u,
    /CAMPAIGN_COMMAND_REUSED/u, /no handler returns a generic\s+500/u]);
});

test("D2085 terminal transition is the award issuer", () => {
  includesAll(normative, [/Durable award issuance is part of the terminal transition/u,
    /same transaction/u, /if the campaign is completed, its required award rows committed/u,
    /Crash\/fault injection before commit leaves neither/u]);
});

test("D2086 fixture and official campaign have different authorities", () => {
  includesAll(normative, [/tools\/campaign-two-horizon-author-contract\/fixtures\/campaign-contract\.json/u,
    /never registered\s+or rendered/u, /owner\/human chess-content authority/iu,
    /opening, middlegame and endgame consequence encounters/u,
    /law 8 forbids.*choosing the campaign's\s+chess lessons/su,
    /D8 \| At least one official 1\.0 campaign/u]);
  assert.doesNotMatch(normative, /seed `content\/campaigns\/seed-endgames\.json`/u);
});

test("the core refusals and complete UX boundary survive", () => {
  includesAll(normative, [/kind: "module_unlock"; moduleId: UnlockableModuleId/u,
    /generic `tool_unlock`, free-form reward id/u, /proves opportunity only, never usefulness or learning effect/u,
    /Campaign home and resume/u, /Encounter preparation/u, /In-run context/u, /Node result/u,
    /Run result/u, /no primitive settings wall/u, /\[\[D1600\]\]'s no-exhaustible-tool failure stage/u]);
});
