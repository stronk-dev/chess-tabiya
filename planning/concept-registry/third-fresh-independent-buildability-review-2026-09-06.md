# Concept registry — third fresh independent buildability review

**Verdict:** return the RFC on [[D2878]]–[[D2884]]. The second repair closes all eight findings it
was assigned, but its executable model still cannot consume the product authorities it claims to
migrate and does not establish a complete registry-to-consumer chain.

## Reproduced blockers

1. **[[D2878]] The migration uses invented storage and run shapes.** Production
   `attempt_concepts` has compound key `(run_id, branch_id, concept_key)` and no `row_id`; the model
   selects `c.row_id`. Its private `{id, packId, packDigest, branchIds}` parser rejects a real
   `DrillRun` snapshot despite the RFC requiring the runtime's exact replay/parser.
2. **[[D2879]] Reduced projections impersonate exact pack artifacts.** Production `pack_digest` is
   the digest of the complete pack document and `registered_packs` stores `document_json`. The model
   instead hashes `{id, concepts}` as the occurrence digest in an invented
   `installed_pack_artifacts.projection_json` table. A real full-pack digest therefore quarantines
   an otherwise matching occurrence as invalid.
3. **[[D2880]] The accepted migration population is outside the transaction.** Both receipt lookup
   and `migrationInput(database)` execute before `BEGIN IMMEDIATE`. Another writer can change the
   database between the accepted read and the lock, contradicting the stated one-transaction
   population operation.
4. **[[D2881]] Restart validates only legacy-row inputs.** After a successful migration, deleting
   every registered output, corrupting the installed artifact and supplying a different registry
   digest still returns the old receipt. Registry/artifact preimages, partition outputs and stored
   receipt bytes are neither joined nor revalidated.
5. **[[D2882]] The immutable-history compiler is absent.** The normative
   `compileConceptRegistry(headBytes, revisionFiles)` operation has no model. Only sequential
   in-memory `publish` calls exist, so no current-head parser, revision filename/digest check,
   missing predecessor, cycle or on-disk history traversal can fail.
6. **[[D2883]] Import anchors are counted as consumers.** Six files that import `registry` and do
   nothing except `void registry` satisfy closure. The scanner has no module resolution, type
   checker, symbol/reference graph or operation-level obligation, so it proves neither the six
   named behaviors nor closure through barrels/re-exports.
7. **[[D2884]] Label collision is not Unicode case folding.** `toLocaleLowerCase("en-US")` accepts
   `Straße` beside `STRASSE`. The RFC promises unique case-folded labels; the implemented predicate
   is a narrower locale-lowercase comparison.

## Evidence and required repair

`make concept-registry-third-fresh-review` retains all 29 predecessor controls and passes 7/7 new
falsifiers. A green review target means the failures reproduce; it is not acceptance.

The next author repair must bind the migration to the real compound-key storage schema, runtime run
parser and full `PackRegistry` artifacts; take and validate the complete migration preimage and
partition inside one transaction; implement the exact head/revision-file compiler; replace import
anchors with operation-level consumer obligations over a resolved symbol graph; and specify one
portable Unicode label-collision rule. Another genuinely fresh review and the shared-resource
bootstrap dependency still precede implementation.
