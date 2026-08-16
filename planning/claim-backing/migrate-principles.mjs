import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

const phases = ["opening", "middlegame", "endgame"];
const provenance = {
  licence: "CC-BY-SA-4.0",
  sources: ["Synthesized from the authored claims in content/drafts during the claim-backing migration; no machine or external source establishes the judgement."],
  attribution: [{ title: "Tabiya authored claim corpus", author: "Tabiya", licence: "CC-BY-SA-4.0" }],
};
const rows = [
  ["result-not-moves", "Grade the result, not the route", "A consequence drill grades the declared result rather than imitation of an authored line.", "The route matters when the objective explicitly grades a named technique or intermediate structure."],
  ["tempo-is-the-currency", "Tempo is the currency", "In races and opening development, a move spent only reacting is a move not spent advancing the side's own task.", "A defensive move that also advances the task does double duty and should not be counted as a lost tempo."],
  ["construction-order-matters", "Construction order matters", "When one setup move makes the next safe, the order is part of the plan rather than a cosmetic move sequence.", "If the moves are independently legal and effective, changing their order need not change the plan."],
  ["structure-outlives-arrangement", "Structures outlive arrangements", "A durable pawn concession or fixed square can remain relevant after the pieces that created it have moved or traded.", "A pawn break or exchange can dissolve the structure, after which the old plan no longer has the same basis."],
  ["count-before-conclusion", "Count before concluding", "Concrete attacker, defender, pawn, or route counts should be checked before drawing a strategic conclusion from a position.", "Exact counts do not by themselves establish which side is better or which move should be played."],
  ["preparation-is-asymmetric", "Preparation is asymmetric", "A recurring structure may be more familiar to the player who reaches it through a narrower repertoire than to the opponent who meets it occasionally.", "Individual experience can reverse the population-level preparation asymmetry."],
  ["threat-before-opportunity", "Threat before opportunity", "A reply should account for the opponent's immediate threat before pursuing a new opportunity.", "When the opponent has no executable threat, forcing play or development may properly take priority."],
  ["guard-calibration-is-authored", "Guard calibration is authored", "A feedback guard's threshold and silence band are authored teaching choices, not measurements of universal chess error.", "A different learner band or teaching objective can justify a different threshold."],
  ["development-can-be-attack", "Development can do attacking work", "A developing move is especially efficient when it also contests the position's current structural target.", "Development that ignores a forcing threat or misplaces a piece does not become good merely by being development."],
  ["material-serves-purpose", "Material serves the conversion", "In conversion play, material may be exchanged or returned when doing so advances the actual winning or drawing mechanism.", "Material remains decisive when the proposed concession removes the resources needed to complete the objective."],
  ["activity-has-a-price", "Activity has a price", "Active pieces gain useful reach by leaving some prior defensive task, so the released duty should be named before the move is chosen.", "A move can improve activity without conceding anything when another piece or structural fact already covers the old duty."],
  ["technique-is-conditional", "Technique is conditional", "Named techniques apply when their defining geometry and timing are present, not merely because the material family has the same name.", "A nearby but different geometry can require another scheme even with identical material."],
  ["authored-teaching-is-declared", "Authored teaching is declared", "A teaching decomposition, threshold, or narration is identified as authored when the machine evidence establishes only narrower position facts.", "A statement directly re-derived from a recorded instrument should be attributed to that instrument instead."],
].map(([id,name,statement,counterCase]) => ({ id, version:"0.1.0", name, statement, phases, standsOn:"authors_practice", counterCase, provenance }));

function principle(claim) {
  const id = claim.id, text = claim.text.toLowerCase();
  if (id === "result-not-moves") return "result-not-moves";
  if (/authored|encoding|threshold|narration|decomposition|shape-fires|readiness-is-structural|opposition-is-detected/.test(`${id} ${text}`)) return "authored-teaching-is-declared";
  if (/guard/.test(id)) return "guard-calibration-is-authored";
  if (/threat|two-questions|brake/.test(`${id} ${text}`)) return "threat-before-opportunity";
  if (/prep|asymmetr|one-setup/.test(`${id} ${text}`)) return "preparation-is-asymmetric";
  if (/order|phase|wall-then|bishop-before|two-phase|method-in/.test(`${id} ${text}`)) return "construction-order-matters";
  if (/tempo|beat|race|rent|new-work|exchange-rate/.test(`${id} ${text}`)) return "tempo-is-the-currency";
  if (/count|arithmetic|census|readiness|distance/.test(`${id} ${text}`)) return "count-before-conclusion";
  if (/structure|permanent|hook|chain|minority|outlives|empty-file|break-denial/.test(`${id} ${text}`)) return "structure-outlives-arrangement";
  if (/trade|material|fuel|pawn|king-second|decline-rook/.test(`${id} ${text}`)) return "material-serves-purpose";
  if (/activity|price/.test(`${id} ${text}`)) return "activity-has-a-price";
  if (/development|double duty|developing/.test(`${id} ${text}`)) return "development-can-be-attack";
  return "technique-is-conditional";
}

function canonical(value) {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

await mkdir("content/principles", { recursive: true });
for (const row of rows) await writeFile(join("content/principles", `${row.id}.json`), `${JSON.stringify(row, null, 2)}\n`);
for (const file of (await readdir("content/drafts")).filter((name) => name.endsWith(".json")).sort()) {
  const path = join("content/drafts", file), pack = JSON.parse(await readFile(path, "utf8"));
  let changed = false;
  if (pack.id === "philidor-third-rank-hold") {
    const claim = pack.feedbackClaims?.find((candidate) => candidate.id === "philidor-is-drawn");
    if (claim !== undefined && !claim.evidenceTypes.includes("author_principle")) { claim.evidenceTypes.push("author_principle"); claim.principles = ["authored-teaching-is-declared"]; changed = true; }
  }
  for (const claim of pack.feedbackClaims ?? []) if (claim.evidenceTypes.includes("author_principle")) {
    const next = [principle(claim)];
    if (JSON.stringify(claim.principles) !== JSON.stringify(next)) { claim.principles = next; changed = true; }
  }
  if (changed) await writeFile(path, `${JSON.stringify(pack, null, 2)}\n`);
  if ((pack.feedbackClaims ?? []).some((claim) => claim.evidenceTypes.includes("author_principle"))) {
    const evidencePath = join("content/drafts", file.replace(/\.json$/, ".evidence.json"));
    try {
      const ledger = JSON.parse(await readFile(evidencePath, "utf8"));
      ledger.packDigest = `sha256:${createHash("sha256").update(canonical(pack)).digest("hex")}`;
      if (pack.id === "philidor-third-rank-hold") {
        const claimIndex = pack.feedbackClaims.findIndex((claim) => claim.id === "philidor-is-drawn"), claim = pack.feedbackClaims[claimIndex];
        const fens = [pack.start.fen, ...ledger.records.filter((record) => record.kind === "tablebase_result" && record.supports?.some((pointer) => pointer.startsWith("/spine"))).sort((left, right) => left.supports[0].split("/children").length - right.supports[0].split("/children").length).map((record) => record.values.fen)];
        const next = { claimId:claim.id,pointer:`/feedbackClaims/${claimIndex}/text`,textSha256:`sha256:${createHash("sha256").update(claim.text).digest("hex")}`,spans:[
          {span:"draw",assertion:{kind:"tablebase.category@v1",args:{fen:pack.start.fen}}},
          {span:"five",assertion:{kind:"tablebase.pieceCount@v1",args:{fen:pack.start.fen}}},
          {span:"drawn",assertion:{kind:"tablebase.lineUniformCategory@v1",args:{fens}}},
          {span:"lost",assertion:{kind:"tablebase.moveCategory@v1",args:{fen:pack.start.fen,uci:"h6h8"}}},
        ] };
        ledger.claimBindings = [...(ledger.claimBindings ?? []).filter((binding) => binding.claimId !== claim.id), next];
      }
      await writeFile(evidencePath, `${canonical(ledger)}\n`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}
