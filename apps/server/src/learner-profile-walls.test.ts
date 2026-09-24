// rfc/player-style.md criterion 10 (a reference or style value never reaches a grade, hint, voice or
// verdict path) and rfc/skills.md criterion 14 (no skill state gates campaign advance) as import
// walls over the source tree: the profile is a leaf consumer that nothing chess-speaking reads.
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(process.cwd());
const PROFILE_MODULES = /learner-profile|style-contract|style-atoms|skills-contract|STYLE_METRICS|HabitCard|ConceptMark|deriveConceptMarks|first_concept/u;

function source(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function sources(directory: string): readonly string[] {
  return readdirSync(resolve(ROOT, directory)).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts")).map((name) => join(directory, name));
}

describe("the profile is a leaf: no grade, hint, voice, feedback or verdict path reads it", () => {
  it("keeps every chess-speaking module free of style and skill state", () => {
    const speaking = [
      "packages/runtime/src/grade.ts", "packages/runtime/src/grade-reading.ts", "packages/runtime/src/voice.ts",
      "packages/runtime/src/feedback.ts", "packages/runtime/src/postcommit-nudge.ts", "packages/runtime/src/review-map.ts",
      "apps/server/src/guidance.ts", "apps/server/src/external-voice.ts", "apps/server/src/feedback-policy.ts",
      "apps/server/src/authored-feedback.ts", "apps/server/src/opponent-selector.ts", "apps/server/src/service.ts",
    ];
    for (const path of speaking) expect(source(path), path).not.toMatch(PROFILE_MODULES);
  });

  it("is imported only by the application composition and the REST boundary", () => {
    const importers = sources("apps/server/src").filter((path) => /from "\.\/learner-profile\.js"/u.test(source(path)));
    expect(importers.sort()).toEqual(["apps/server/src/application.ts", "apps/server/src/rest.ts"]);
  });
});

describe("skills criterion 14 — no skill state gates campaign advance", () => {
  it("keeps every campaign progression module free of marks, credits and profile reads", () => {
    const campaign = [
      ...sources("packages/runtime/src").filter((path) => /campaign/u.test(path)),
      ...sources("apps/server/src").filter((path) => /campaign/u.test(path)),
    ];
    expect(campaign.length).toBeGreaterThanOrEqual(4);
    for (const path of campaign) {
      expect(source(path), path).not.toMatch(PROFILE_MODULES);
      expect(source(path), path).not.toMatch(/learnerMarks|learner_marks|milestones\(/u);
    }
  });
});
