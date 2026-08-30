// DISPOSABLE fresh independent review harness — D2127-D2134. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/intent-presets.md");
const modules = read("rfc/module-registration.md");
const preference = read("apps/web/src/lib/assistance-preference.ts");
const settings = read("apps/web/src/lib/AssistanceSettings.svelte");
const drill = read("apps/web/src/lib/DrillScreen.svelte");
const campaign = read("rfc/campaign-core.md");
const register = read("rfc/README.md");

function section(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return text.slice(from, to);
}

test("D2127: the persisted override field type is referenced but never declared", () => {
  assert.match(rfc, /Partial<AssistancePreferenceFields>/u);
  assert.doesNotMatch(rfc, /(?:export\s+)?(?:type|interface)\s+AssistancePreferenceFields\b/u);
});

test("D2128: preset identity is duplicated without the context-style equality guard", () => {
  const compiler = section(rfc, "export function compileAssistance", "#### §5.3");
  assert.match(compiler, /readonly preset: PresetId/u);
  assert.match(compiler, /readonly preference: WorkflowPreferenceReceipt/u);
  assert.match(rfc, /kind: "explicit"; readonly preset: PresetId/u);
  assert.match(rfc, /kind: "migrated_snapshot"; readonly preset: PresetId/u);
  assert.match(compiler, /input\.context` must equal `input\.access\.workflowContext/u);
  assert.doesNotMatch(compiler, /input\.preset` must equal|preset.*preference\.preset.*(?:equal|mismatch|refus)/iu);
});

test("D2129: client-only compilation contradicts the server-authoritative module contract", () => {
  assert.match(rfc, /\*\*One caller, and it is client-side\./u);
  assert.match(rfc, /compiler is not a security boundary/u);
  assert.match(modules, /server strict-parses the receipt[\s\S]{0,500}compiles the effective configuration/u);
  assert.match(modules, /returns both requested and effective\s+digests/u);
});

test("D2130: higher Custom values cannot create their governed effects", () => {
  assert.match(rfc, /learner who wants both[\s\S]{0,100}`guided: "live"` by hand/iu);
  assert.match(rfc, /Any higher raw value is still configurable/u);
  assert.match(rfc, /a module absent\s+from `modules` produces zero effects regardless of a higher Advanced value/u);
});

test("D2131: suppression records omit required requested/effective/reason facts", () => {
  const record = section(rfc, "export interface SuppressionRecord", "```\n\nRules");
  assert.match(record, /readonly subject:/u);
  assert.match(record, /readonly by:/u);
  assert.doesNotMatch(record, /requested|effective|reason/u);
  assert.match(rfc, /\{subject, by:"availability", requested, effective, reason\}/u);
  assert.match(rfc, /requested:"sight",effective:"off"/u);
});

test("D2132: availability effects have no producer/source dependency identity", () => {
  assert.match(rfc, /only their source-dependent effects are\s+suppressed/u);
  assert.match(rfc, /`CompiledAssistanceEffect` is a closed union keyed by\s+`\{moduleId, timing, form, subSurface\?, outputChannel\?\}`/u);
  assert.doesNotMatch(rfc, /EffectSourceDependency|effectSource|producerIds?:|sourceDependencies:/u);
});

test("D2133: the migration closeout omits live legacy writers", () => {
  assert.match(preference, /export function saveAssistance/u);
  assert.match(settings, /saveAssistance\(/u);
  assert.match(drill, /saveAssistance\(/u);
  const criterion = section(rfc, "15. **The authoritative receipt", "16. **The preset UI");
  assert.match(criterion, /old v1 loaders/u);
  assert.doesNotMatch(criterion, /saveAssistance|old v1 writers/u);
});

test("D2134: campaign authority is undefined and owned by a returned dependency", () => {
  assert.match(rfc, /CampaignEncounterReceipt/u);
  assert.doesNotMatch(rfc, /(?:export\s+)?(?:type|interface)\s+CampaignEncounterReceipt\b/u);
  assert.doesNotMatch(campaign, /(?:export\s+)?(?:type|interface)\s+CampaignEncounterReceipt\b/u);
  assert.match(register, /`campaign-core\.md` \| \*\*draft — returned by fresh independent buildability review/u);
  const header = section(rfc, "- **Depends on:**", "- **Parent / amends:**");
  assert.doesNotMatch(header, /campaign-core/u);
});
