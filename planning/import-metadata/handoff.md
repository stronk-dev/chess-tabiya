# Import selection and omission metadata — contract handoff

**Owner:** account-and-data authoring lane · **State:** author contract owed · **Routes:** [[D1837]],
IMP-a1, IMP-a2, IMP-a4

## Why this is not a client-only task

The accepted and implemented import contract deliberately refuses multi-game and variation-bearing
PGN (`rfc/archive/game-import-and-story.md` §§2.5, 4.1), while the later UX research requires a
game picker, mainline import, and an explicit omission notice
(`design/research/ux-import-and-account.md` §§2.3–2.4b). The current `ImportedGameRecord` and
`imported_games` row preserve the source PGN and the imported mainline, but do not record which game
was selected from a multi-game source, how many games the source contained, or that variations were
omitted. A browser-only implementation could show the right confirmation once and then lose that
truth after reload, export, or another device.

## Authoring task

Produce a successor import-metadata contract, after rechecking the living storage and migration
register at author time. It must settle, without editing the archived RFC:

1. the durable identity of the selected game inside the retained source bytes;
2. the source-game count and variation-omission fact required by confirmation, resumed runs and
   exports;
3. the exact API representation and typed absence for historical single-game imports;
4. account export/deletion and migration behavior in lockstep with `ImportedGameRecord`;
5. the claimed migration position relative to the already-held `imported_games` rebuilds; and
6. a negative fixture proving the omission notice cannot be reconstructed from ambiguous source
   bytes or disappear after reload.

Do not implement the picker before this contract is accepted. The existing single-game import path
remains production behavior, and no new chess judgement is involved.

## Executable order after acceptance

1. Persist and round-trip the metadata at storage, account-export and production API boundaries.
2. Parse all games, expose a confirmation model, and import only the selected mainline.
3. Render the picker and confirmation journey with honest historical absence.
4. Prove paste → choose → confirm → reload → export in a production-browser journey.
5. Close D1837 and IMP-a1/a2/a4 in the shipping commit.
