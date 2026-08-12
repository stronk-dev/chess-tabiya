# Sourcing candidates

This directory contains reproducible, machine-generated inputs for human authors. A
candidate is not reviewed content and is never served by the pack registry.

Each candidate directory contains `pack.json`, `evidence.json`, `sources.json`, and
`job.json`. It lives here—not in `content/drafts/`, whose JSON files are loaded in
development, and not in `content/packs/`, whose JSON files are served to learners—so its
private evidence sidecar cannot be mistaken for a pack or leak into the application.

Raw source caches belong in the gitignored `content/sources/` directory.
