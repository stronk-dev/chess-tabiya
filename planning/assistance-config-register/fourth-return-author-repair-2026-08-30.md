# AssistanceConfig register — fourth-return author repair

- **Date:** 2026-08-30
- **Input:** `rfc/assistance-config-register.md` after the D2113–D2117 return
- **Verdict:** author repair complete; fresh independent review required
- **Author contract:** `make assistance-register-second-author-repair` — 8/8 green
- **Historical falsifier:** `make assistance-register-second-fresh-review` — 5/5 now red, the
  intended inversion
- **Production status:** unchanged; C9/register/v5 remain unauthorized

The return exposed one underlying error: the proposed resource identity covered the interface and
some reader symbols, not the full persisted/configured contract. The repair replaces that root list
with one closed authority graph.

## What changed

1. **Phase truth ([[D2113]]).** Bootstrap v4 now admits and seals the real web-local `validV4` and
   `migrate`. Head 5 must remove both and add the sole runtime `parseAssistanceConfig`; the process
   landing no longer depends on a future product file.
2. **Read/write closure ([[D2114]]).** One graph contains the storage key, reader, writer,
   serializer and codec/migration edges. Reader and writer must share the key and current-head
   codec. A second reader/writer or divergent key fails.
3. **Fixed-head identity ([[D2115]]).** Canonical node/edge bytes join the contract digest. Key,
   migration default, unknown-field policy, serializer, constructor, permission or UI projection
   drift at an unchanged head is invalid.
4. **Complete v5 delta ([[D2116]]).** The reservation is ten graph nodes, not four guessed roots:
   version/field, silent default, permission projection, Advanced projection, reader, writer,
   central codec and both deleted legacy operations. The preset/clamp compiler remains a named
   product discharge rather than being mislabeled persistence authority.
5. **Executable grammar ([[D2117]]).** The RFC now defines closed TS/Svelte node and edge kinds,
   discovery, canonical subtree bytes, Svelte preprocessing, symmetric-difference transition
   identity and fail-closed unsupported syntax. The author harness derives the current graph from
   real source and crosses v5, drift and Svelte mutations.

## Boundary

No production runtime, web, schema, storage, content, archive or protected-design byte changed.
This is an RFC-authoring repair. It authorizes neither C9 implementation nor AssistanceConfig v5.
