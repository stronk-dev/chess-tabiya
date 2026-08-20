// DISPOSABLE research prototype — platform-alignment R3. Not production code.
import { compilePrototypeState, moduleMessage, modules, presets, scenarios, workflows } from "./prototype-model.js";

const root = document.querySelector("#prototype");
const state = { workflowId: "just_play", presetId: "quiet", scenarioId: "useful", committed: false, staged: false, hintStage: 0, customize: false };

function button(label, attrs = "") {
  return `<button type="button" ${attrs}>${label}</button>`;
}

function renderBoard() {
  const pieces = { a8: "♜", c8: "♝", e8: "♚", f8: "♝", h8: "♜", a7: "♟", b7: "♟", c7: "♟", f7: "♟", g7: "♟", h7: "♟", d5: "♟", e5: "♟", c3: "♘", e4: "♙", a2: "♙", b2: "♙", c2: "♙", f2: "♙", g2: "♙", h2: "♙", a1: "♖", c1: "♗", e1: "♔", f1: "♗", h1: "♖" };
  const squares = [];
  for (let rank = 8; rank >= 1; rank -= 1) for (const file of "abcdefgh") {
    const id = `${file}${rank}`;
    squares.push(`<button type="button" class="square" data-square="${id}" aria-label="${pieces[id] ? `${pieces[id]} on ` : "Empty "}${id}" aria-pressed="false"><span aria-hidden="true">${pieces[id] ?? ""}</span></button>`);
  }
  return `<div class="board" role="group" aria-label="Research chessboard fixture">${squares.join("")}</div>`;
}

function renderModule(id, current) {
  const message = moduleMessage(id, current);
  return `<article class="module module--${message.tone}" data-module="${id}"><div class="module__meta">${modules[id].label} · fixture id ${id === "theory_breadcrumb" ? "T-01" : id === "blunder_prevention" ? "R-01" : "F-02"}</div><h3>${message.title}</h3><p>${message.body}</p>${id === "theory_breadcrumb" && message.tone !== "empty" ? '<a href="#citation">Open cited passage</a>' : ""}</article>`;
}

function render() {
  const current = compilePrototypeState(state);
  const workflowButtons = Object.entries(workflows).map(([id, item]) => button(item.label, `class="workflow ${id === state.workflowId ? "is-active" : ""}" data-workflow="${id}" aria-pressed="${id === state.workflowId}"`)).join("");
  const presetButtons = current.workflow.allowedPresets.map((id) => button(presets[id].label, `class="preset ${id === state.presetId ? "is-active" : ""}" data-preset="${id}" aria-pressed="${id === state.presetId}"`)).join("");
  const moduleCards = current.visible.map((id) => renderModule(id, current)).join("");
  const advancedRows = Object.entries(modules).map(([id, item]) => {
    const allowed = current.workflow.ceiling.includes(id);
    const active = current.enabled.includes(id);
    return `<li><label><input type="checkbox" ${active ? "checked" : ""} ${allowed ? "" : "disabled"} data-custom-module="${id}"> ${item.label}</label><span>${allowed ? item.disposition : "Not permitted in this workflow"}</span></li>`;
  }).join("");
  root.innerHTML = `
    <header class="hero"><div><div class="eyebrow">Disposable R3 research prototype</div><h1>Choose the kind of help—not the machinery</h1><p>All chess-like messages below are synthetic fixture text. This artifact tests workflow and disclosure comprehension; it does not grade a move.</p></div><label class="scenario">Test state<select data-scenario>${Object.entries(scenarios).map(([id, item]) => `<option value="${id}" ${id === state.scenarioId ? "selected" : ""}>${item.label}</option>`).join("")}</select></label></header>
    <nav class="workflows" aria-label="Learning workflows">${workflowButtons}</nav>
    <section class="promise"><div><div class="eyebrow">${current.workflow.label}</div><h2>${current.workflow.purpose}</h2></div><div class="preset-summary"><strong>${current.preset.label}</strong><span>${current.preset.detail}</span></div></section>
    <div class="layout"><main>${renderBoard()}<div class="board-actions">${button(state.staged ? "Cancel staged fixture move" : "Stage fixture move", `data-action="stage"`)}${button(state.committed ? "Rewind fixture" : "Commit fixture move", `data-action="commit"`)}${current.enabled.includes("sight_on_request") ? button("What does this piece see?", `data-action="sight"`) : ""}${current.enabled.includes("guided_hint") && state.committed ? button(state.hintStage ? "Another hint" : "Give me a hint", `data-action="hint"`) : ""}</div><div id="sight-result" class="inline-result" hidden></div></main>
    <aside><section class="preset-panel"><div class="section-heading"><div><div class="eyebrow">Assistance</div><h2>How should this session help?</h2></div>${button("Customize", `data-action="customize" aria-expanded="${state.customize}"`)}</div><div class="presets">${presetButtons}</div></section>
    ${current.suppressed.length ? `<div class="ceiling" role="status"><strong>This workflow has a ceiling.</strong><span>${current.suppressed.map((id) => modules[id].label).join(", ")} cannot be restored by a preset.</span></div>` : ""}
    <section class="modules" aria-live="polite">${moduleCards || '<div class="quiet"><strong>The board is intentionally quiet.</strong><span>Make a move, request exact sight, or choose another assistance preset.</span></div>'}</section></aside></div>
    <dialog ${state.customize ? "open" : ""} class="customize"><div class="section-heading"><div><div class="eyebrow">Advanced configuration</div><h2>Every registered module has a home</h2></div>${button("Close", `data-action="customize"`)}</div><p>Normal workflows use presets. This research view shows safe learner customization and explains what the session ceiling removes. Provider/source detail belongs in Analyze, not first-run setup.</p><ul>${advancedRows}</ul><div class="provider-row"><span>Rules</span><span>Semantic detectors</span><span>Human corpus</span><span>Engine</span><span>Theory index</span></div></dialog>`;
}

root.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.workflow) {
    state.workflowId = target.dataset.workflow;
    state.presetId = workflows[state.workflowId].defaultPreset;
    state.committed = false; state.staged = false; state.hintStage = 0;
  } else if (target.dataset.preset) {
    state.presetId = target.dataset.preset; state.hintStage = 0;
  } else if (target.dataset.action === "stage") state.staged = !state.staged;
  else if (target.dataset.action === "commit") { state.committed = !state.committed; state.staged = false; state.hintStage = 0; }
  else if (target.dataset.action === "hint") state.hintStage = Math.min(4, state.hintStage + 1);
  else if (target.dataset.action === "customize") state.customize = !state.customize;
  else if (target.dataset.action === "sight") {
    const result = root.querySelector("#sight-result");
    result.hidden = false;
    result.innerHTML = '<strong>Exact sight fixture S-01</strong><span>One local relation is highlighted. It contains no evaluation, candidate or best move.</span>';
    return;
  } else if (target.dataset.square) {
    root.querySelectorAll(".square").forEach((square) => square.setAttribute("aria-pressed", String(square === target)));
    return;
  }
  render();
});

root.addEventListener("change", (event) => {
  if (event.target.matches("[data-scenario]")) { state.scenarioId = event.target.value; render(); }
});

render();
