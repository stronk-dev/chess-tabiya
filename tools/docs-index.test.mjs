import assert from "node:assert/strict";
import test from "node:test";

import { markdownTargets, validateDocsIndex } from "./docs-index.mjs";

test("extracts local Markdown targets without anchors", () => {
  assert.deepEqual(markdownTargets("[one](a.md#part) [two](../b.json)"), ["a.md", "../b.json"]);
});

test("requires every direct document exactly once and every contributor entry point", () => {
  const errors = validateDocsIndex({
    docFiles: ["architecture.md", "orphan.md"],
    index: "[Architecture](architecture.md) [Again](architecture.md) [Gone](gone.md)",
    rootReadme: "[Docs](docs/README.md)",
  });
  assert(errors.some((error) => error.includes("orphan.md")));
  assert(errors.some((error) => error.includes("architecture.md 2 times")));
  assert(errors.some((error) => error.includes("unknown direct document docs/gone.md")));
  assert(errors.some((error) => error.includes("CONTRIBUTING.md")));
  assert(errors.some((error) => error.includes("docs/features.md")));
});

test("accepts a complete index and root navigation", () => {
  assert.deepEqual(validateDocsIndex({
    docFiles: ["architecture.md", "features.md"],
    index: "[Architecture](architecture.md) [Features](features.md) [Roadmap](../planning/roadmap-to-done.md)",
    rootReadme: [
      "[Contributing](CONTRIBUTING.md)",
      "[Docs](docs/README.md)",
      "[Architecture](docs/architecture.md)",
      "[Extending](docs/extending.md)",
      "[Features](docs/features.md)",
    ].join(" "),
  }), []);
});
