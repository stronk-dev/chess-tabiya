# Knowledge-retrieval harness

Disposable instrument for platform-alignment R4. It builds a small, licensed chess corpus and a
predeclared gold set, then compares exact keys, lexical retrieval, raw embeddings, filtered hybrid,
reranking, and Skipper's contextualized embeddings.

This is not product code. It does not expose a hint route, generate chess claims, or make Skipper a
Tabiya dependency. Source text is fetched into temporary storage and is not committed.

## Inputs

- Lichess `chess-openings` commit `4b8622759e7ae6f93f011cc6c83a3823401ab45e` (CC0-1.0)
- a bounded prefix of the Lichess puzzle export already pinned by the R1 harness (CC0-1.0)
- eight pinned Wikibooks revisions (CC BY-SA 4.0)
- selected local research records, explicitly labelled as authored or instrument evidence

## Run

Prepare the corpus and gold set:

```sh
node tools/knowledge-retrieval-harness/prepare.mjs
```

The evaluator deliberately reads provider credentials from the adjacent Frameworks checkout and
never prints or writes them. A healthy disposable Skipper instance is expected at port 18028.

```sh
node tools/knowledge-retrieval-harness/evaluate.mjs
```

Generated raw artifacts live under `/private/tmp/tabiya-r4-knowledge/`. The committed result is the
aggregate decision record, not provider responses or third-party prose.
