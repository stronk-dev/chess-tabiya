// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 re-measurement (2026-08-17).
// Not production code.
//
// The 2026-08-16 finding identified AUTHORED OBJECTIVE LENGTH as the trigger for
// the D507 layout failure: 68 characters in the schema example against 277-444
// in the endgame corpus. The D507 fix bounds the objective block, so the
// question a re-measurement owes is: at what length does it break NOW, if it
// still does? `objective.summary` is `nonEmptyString` in
// schemas/drill_pack.schema.json:223 -- no maxLength -- so the corpus is free to
// grow past 444 and nothing stops it.
//
// This writes clones of one real endgame pack whose ONLY difference is the
// length of `objective.summary`, into the served drafts directory. Caller
// restarts the harness server, then runs the occlusion / playability probes.
//
// Usage: node length-sweep.mjs <drafts-dir> <source-pack-id> <len> [len...]
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const draftsDir = process.argv[2];
const sourceId = process.argv[3];
const lengths = process.argv.slice(4).map(Number);

const source = JSON.parse(await readFile(join(draftsDir, `${sourceId}.json`), "utf8"));

// Real English prose at display size, not a run of one character: line-breaking
// behaviour is part of what is being measured.
const WORDS = (
  "the king walks to the corner your bishop owns while the knight covers the flight "
  + "squares and the defending king is driven along the edge toward the mating net you "
  + "have prepared with the opposition and a tempo move in reserve so that every check "
  + "shortens the distance rather than resetting it and the fifty move counter never "
  + "becomes the reason the win slips away from a position that is winning by force "
).split(/\s+/u).filter((word) => word !== "");

function prose(length) {
  let text = "";
  let index = 0;
  while (text.length < length) {
    text += (text === "" ? "" : " ") + WORDS[index % WORDS.length];
    index += 1;
  }
  return `${text.slice(0, length - 1).trimEnd()}.`.padEnd(length, ".").slice(0, length);
}

for (const length of lengths) {
  const clone = structuredClone(source);
  clone.id = `k9len-${String(length).padStart(4, "0")}`;
  clone.title = `K9 length probe ${length}`;
  clone.objective.summary = prose(length);
  await writeFile(join(draftsDir, `${clone.id}.json`), `${JSON.stringify(clone, null, 2)}\n`);
  console.log(`${clone.id}  summary=${clone.objective.summary.length} chars`);
}
