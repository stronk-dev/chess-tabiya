// DISPOSABLE research prototype — platform-alignment R3. Not production code.

export const modules = Object.freeze({
  rules_floor: { label: "Legal interaction", disposition: "normal" },
  sight_on_request: { label: "What this piece sees", disposition: "advanced" },
  blunder_prevention: { label: "Staged-move warning", disposition: "advanced" },
  postcommit_nudge: { label: "After-move nudge", disposition: "normal" },
  guided_hint: { label: "Progressive hint", disposition: "advanced" },
  compare_coach: { label: "Compare attempts", disposition: "advanced" },
  theory_breadcrumb: { label: "Cited theory", disposition: "normal" },
  review_map: { label: "Review moments", disposition: "inspector" },
  full_inspector: { label: "Raw evidence inspector", disposition: "inspector" },
});

export const presets = Object.freeze({
  quiet: { label: "Quiet", detail: "No chess guidance until you ask.", modules: ["rules_floor"] },
  guided: { label: "Guide me", detail: "Small help after you commit; deeper hints only when requested.", modules: ["rules_floor", "sight_on_request", "postcommit_nudge", "guided_hint", "compare_coach", "theory_breadcrumb"] },
  theory_only: { label: "Theory only", detail: "Cited theory, with no evaluation, candidates or best move.", modules: ["rules_floor", "theory_breadcrumb"] },
  support: { label: "Support", detail: "Warn about a staged-move risk, but never reveal the best move.", modules: ["rules_floor", "sight_on_request", "blunder_prevention", "postcommit_nudge", "guided_hint", "theory_breadcrumb"] },
  analysis: { label: "Analyze", detail: "Attributed evidence, evaluations, candidates and lines.", modules: ["rules_floor", "review_map", "compare_coach", "theory_breadcrumb", "full_inspector"] },
});

const all = Object.keys(modules);
const without = (...ids) => all.filter((id) => !ids.includes(id));

export const workflows = Object.freeze({
  just_play: { label: "Just Play", purpose: "Play a complete game on your terms.", defaultPreset: "quiet", allowedPresets: ["quiet", "guided", "theory_only", "support"], ceiling: all },
  guided_rehearsal: { label: "Guided Rehearsal", purpose: "Commit, play the consequence, rewind and compare.", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only"], ceiling: without("blunder_prevention", "full_inspector") },
  learn_position: { label: "Learn This Position", purpose: "Start from cited theory and play what follows.", defaultPreset: "theory_only", allowedPresets: ["quiet", "guided", "theory_only"], ceiling: without("blunder_prevention") },
  review_retry: { label: "Review & Retry", purpose: "Choose a moment, retry it, then compare.", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only", "analysis"], ceiling: without("blunder_prevention") },
  analyze_freely: { label: "Analyze Freely", purpose: "Inspect every attributed source deliberately.", defaultPreset: "analysis", allowedPresets: ["analysis", "theory_only"], ceiling: all },
  campaign: { label: "Campaign", purpose: "Prototype only: prove an episode ceiling can suppress assistance.", defaultPreset: "guided", allowedPresets: ["quiet", "guided", "theory_only"], ceiling: without("blunder_prevention", "full_inspector", "review_map") },
});

export const scenarios = Object.freeze({
  useful: { label: "Eligible facts", theory: "available", provider: "available" },
  empty: { label: "Nothing relevant", theory: "empty", provider: "available" },
  unavailable: { label: "Optional provider unavailable", theory: "available", provider: "unavailable" },
});

export function compilePrototypeState({ workflowId, presetId, scenarioId, committed = false, staged = false, hintStage = 0 }) {
  const workflow = workflows[workflowId];
  const preset = presets[presetId];
  const scenario = scenarios[scenarioId];
  if (!workflow || !preset || !scenario) throw new Error("Unknown prototype state");
  if (!workflow.allowedPresets.includes(presetId)) throw new Error(`${presetId} is not allowed in ${workflowId}`);
  const enabled = preset.modules.filter((id) => workflow.ceiling.includes(id));
  const suppressed = preset.modules.filter((id) => !workflow.ceiling.includes(id));
  const visible = [];
  if (enabled.includes("blunder_prevention") && staged) visible.push("blunder_prevention");
  if (enabled.includes("postcommit_nudge") && committed) visible.push("postcommit_nudge");
  if (enabled.includes("guided_hint") && committed && hintStage > 0) visible.push("guided_hint");
  if (enabled.includes("theory_breadcrumb") && (committed || workflowId === "learn_position" || workflowId === "analyze_freely")) visible.push("theory_breadcrumb");
  if (enabled.includes("review_map") && workflowId === "review_retry") visible.push("review_map");
  if (enabled.includes("full_inspector") && workflowId === "analyze_freely") visible.push("full_inspector");
  return Object.freeze({ workflowId, presetId, scenarioId, workflow, preset, scenario, enabled, suppressed, visible, committed, staged, hintStage });
}

export function moduleMessage(moduleId, state) {
  if (state.scenarioId === "empty" && moduleId !== "full_inspector") return { tone: "empty", title: "Nothing relevant to show", body: "The module checked its eligible facts and abstained. Silence is a result, not an error." };
  if (state.scenarioId === "unavailable" && ["postcommit_nudge", "blunder_prevention", "full_inspector"].includes(moduleId)) return { tone: "unavailable", title: "One optional source is unavailable", body: "Available local facts remain separate. This module will not pretend the missing provider returned an answer." };
  const messages = {
    blunder_prevention: { tone: "warning", title: "Support noticed a staged-move risk", body: "Research fixture R-01 fired. Commit anyway or reconsider; no alternative move is shown." },
    postcommit_nudge: { tone: "fact", title: "One consequence changed", body: "Research fixture F-02 is the selected post-commit fact. It carries squares, sign and provenance." },
    guided_hint: { tone: "fact", title: `Hint ${state.hintStage} of 4`, body: ["Look for a changed responsibility.", "Focus on the highlighted side of the board.", "Inspect the selected piece.", "The final stage may name a move only after disclosure."][Math.min(3, state.hintStage - 1)] },
    theory_breadcrumb: state.scenario.theory === "empty"
      ? { tone: "empty", title: "No applicable cited theory", body: "The theory index abstained. It does not fall back to engine prose." }
      : { tone: "theory", title: "General theory — not a recommendation", body: "Research passage T-01 is cited and applicable to the fixture. It does not say which move to play here." },
    review_map: { tone: "fact", title: "Moment 18 · choice changed the consequence", body: "Retry this position before revealing a continuation, or open its cited theory." },
    full_inspector: { tone: "analysis", title: "Attributed inspector", body: "Rules: available · classifier: available · human corpus: unavailable · engine: available · theory: available." },
  };
  return messages[moduleId];
}
