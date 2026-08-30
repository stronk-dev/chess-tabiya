# AssistanceConfig register — third fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/assistance-config-register.md` after the D2113–D2117 fourth-return repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make assistance-register-third-fresh-review` — 4/4 blocker arms
- **Production status:** untouched; C9/register/v5 remain unauthorized

The repair correctly adds phase truth, the writer, fixed-head authority identity and a proposed
TypeScript/Svelte graph. Four remaining contradictions mean the current v4 bootstrap cannot pass
its own grammar and the v5 claim can still land without the in-run feature or its exhaustive preset
columns.

## B1 — the v4 bootstrap already contains two forbidden computed writes ([[D2190]])

The graph grammar hard-fails a dynamic computed assistance key. Current
`AssistanceSettings.svelte#set` and `DrillScreen.svelte#setAssistance` both construct the next
object with `[key]: value`, where `key` is a generic runtime parameter. The author harness scans
only template `configs[kind][dynamicField]` and manually adds selected nodes, so its real-v4
positive never sees either script operation. The process implementation would have to accept a
shape the RFC explicitly refuses or fail on HEAD.

**Required repair:** define a closed resolvable computed-write form whose generic key is proven to
be exactly `keyof Omit<AssistanceConfig,"version">`, include both actual configuration operations
and their literal UI call sites, and continue refusing broad/dynamic keys. Cross a legal generic
write, `string`-widened key, excluded `version`, unknown literal and an unregistered call site.

## B2 — the “exact” v5 delta omits required consumers ([[D2191]])

The ten-token claim includes the Advanced settings field but no `DrillScreen` hint request/use,
even though the graph says the run-screen projection is mandatory and Guided Hint exists only when
pressing the in-run action executes it. It also omits the two `intent-presets` preset/clamp columns
that the product RFC says must land with v5. Calling them a separate discharge does not make C9
observe them. The claimed transition can therefore persist/configure `hintDistance` while gameplay
never reads it, or while presets compile the old nine-field authority.

**Required repair:** decide the resource boundary consistently. If run/preset projections belong
to it, derive their exact nodes into the prior claim and fail when either v5 consumer is absent. If
they are separate product discharges, remove them from the graph's completeness claim and add an
executable non-vacuous handoff that blocks product v5 completion without both real consumers.

## B3 — the node vocabulary cannot represent the closure algorithm ([[D2192]])

Discovery follows imports, calls and property reads/writes in both directions and promises to catch
indirect aliases, but `AssistanceAuthorityKind` contains only final semantic roles. It has no node
kind for an ordinary callable, import/re-export alias, component or intermediate helper. Current
web code reaches the runtime type through the package-root re-export, already requiring at least
one such intermediate operation. The author harness avoids the problem by hand-constructing edges
rather than executing the specified graph.

**Required repair:** publish a graph that can represent every traversed intermediate node, or
define a precise transparent-edge contraction algorithm with ambiguity/cycle rules and exact
source-to-target retention. Test the current barrel re-export, one helper wrapper, two aliases to
one writer, a cycle and an unresolved dynamic call.

## B4 — a cross-package resource is scanned in only two source roots ([[D2193]])

The graph scans `apps/web/src` and `packages/runtime/src` only. A production consumer, writer or
permission projection added to `apps/server/src`, another app or another package is invisible while
the RFC still claims any assistance consumer outside the graph fails closure. The server already
contains a production declaration-census reader of the `AssistanceConfig` declaration, showing the
hard-coded two-root boundary is not the workspace boundary.

**Required repair:** derive production package roots from the workspace/build graph and explicitly
classify tooling/read-only declaration consumers versus value/permission/persistence consumers.
Cross a real server consumer and a new workspace package; neither may silently escape or be
misclassified as product authority.

## Re-review order

1. Make the v4 graph accept only the two proved generic writes.
2. Close or deliberately split the run/preset v5 consumer boundary.
3. Make graph traversal representable across the whole production workspace.
4. Invert all four arms, preserve the earlier contracts and run full verification before another
   independent review.

No checker, workflow, register, claim, runtime, web, schema, content, archive or protected-design
implementation is authorized by this return.
