# Module delivery and staged-move boundary

**Date:** 2026-08-26
**Questions:** What production operation can carry module packets to real seats, and where can
Keep-Me-Safe intercept every board input mode without duplicating behavior?
**Instrument:** `tools/d1588-module-delivery-harness/` (disposable research code/prototype)
**Feeds:** [[D1588]], [[D1590]], [[D1689]]–[[D1692]], `rfc/module-registration.md`

## Verdict

**The module layer has neither a transport nor an input interception problem requiring five
implementations. It needs one new authoritative query operation and one shared candidate
coordinator at the existing convergence point.** `[V]`

The run router has **36 closed actions** and none is a module operation. The client API has no
module method. `EvidencePage` contains exactly `results + nextSeq` and is the asynchronous
producer-job feed, while move mutations, reveal, voice, Story and comparison use distinct
operations. Therefore the draft's phrase *"the existing run/evidence response"* names no
implementable boundary. `[V]` `apps/server/src/rest.ts:697-706`,
`apps/web/src/lib/api.ts:167-170,777-789`; harness route/type arm.

The board side is the inverse. Click, drag and touch all enter Chessground's one `after` callback;
the keyboard grid and SAN/UCI form enter the same `BoardInputController`; every legal path emits
one `BoardInputResult.moveUci`, and promotion emits no candidate until the role is chosen. The
component then calls `onMove` immediately. One interceptor between the result and `onMove` covers
all five modes. `[V]` `apps/web/src/lib/Chessboard.svelte:139-185,227-284`,
`apps/web/src/lib/board-input.ts:236-390`; harness five-mode and promotion arms.

## Current production chain

```text
click / drag / touch ─┐
keyboard grid ────────┼→ BoardInputController → BoardInputResult.moveUci
SAN/UCI text ─────────┘              ↓ (promotion resolves first)
                            Chessboard.apply → onMove
                                   ↓
                           DrillScreen.boardMove
                                   ↓
                     DrillSessionController.move
                                   ↓
                          RunStateStore.move
                                   ↓
                         POST /runs/:id/moves
```

There is no module compiler, query, wire parser, packet cache or seat invocation on that chain.
`[V]` Harness direct-chain arm; `apps/web/src/lib/session-controller.ts:311-334`.

## Smallest coherent module operation

The author amendment should name one operation rather than attach optional fields to unrelated
responses. The smallest coherent shape is a read-like `POST /runs/:runId/module-packets` because
at-commit and on-request queries carry a candidate/square/rung request and may schedule bounded
providers. The client supplies selectors, never the evidence subject. `[M]`

```ts
type ModulePacketQuery =
  | { version: 1; requestId: string; nodeId: string; timing: "pre_commit";
      selectedSquare?: string; requestedPreset: string }
  | { version: 1; requestId: string; nodeId: string; timing: "at_commit";
      candidateUci: string; generation: number; requestedPreset: string }
  | { version: 1; requestId: string; nodeId: string; timing: "post_commit";
      requestedPreset: string }
  | { version: 1; requestId: string; nodeId: string; timing: "checkpoint";
      checkpointEventSeq: number; hintRequest?: unknown; requestedPreset: string }
  | { version: 1; requestId: string; nodeId: string; timing: "review";
      branchId: string; requestedPreset: string };
```

`requestedPreset` is untrusted narrowing input. The server derives the run, node FEN/history,
rules/setup identity, session/workflow, role, disclosure boundary, campaign inventory, permitted
assistance and provider capability, then intersects them. The endpoint must not accept client FEN,
history, evidence rows, effective module ids or a claimed permission—the prediction defect
[[D1685]] demonstrates why subject derivation belongs server-side. `[M]`

The exact preset/custom request field still depends on the unresolved intent-presets owner choice
[[D1660]]. That choice changes only the requested narrowing term; it does not change the operation,
subject authority or response receipt. `[V]`

### Invocation points

| timing | invocation | authoritative subject | invalidation |
|---|---|---|---|
| `pre_commit` | explicit square/threat request | displayed node admitted by guidance access | node/branch, selection, config, role or disclosure changes |
| `at_commit` | after candidate + promotion, before move mutation | current writable node + exact legal candidate | newer generation, revise, node/lease/config change |
| `post_commit` | after learner move succeeds, before automatic opponent | node id from returned `MutationResult.run` | rewind/fork/delete/config; opponent cursor movement does not retarget it |
| `checkpoint` | when checkpoint/reveal boundary opens or learner requests next rung | logged checkpoint event + node | next commit re-closes; rung request/config change |
| `review` | review route/branch entry and explicit node focus | terminal run/branch + focus node | branch/focus/provider/config change |

The post-commit placement is load-bearing. `DrillSessionController.move` receives the learner
mutation result and then calls `#playOpponentIfNeeded`; querying the later active cursor describes
the opponent's reply. The returned run already carries the correct learner node id, so the module
query must capture it before opponent selection. `[V]`
`apps/web/src/lib/session-controller.ts:311-334`; `packages/runtime/src/types.ts:345-348`.

### Closed wire receipt

An F1 process-local brand cannot cross JSON. The response needs an exact parser over a closed wire
receipt, not a serialized `RenderedEvidenceView` claim: `[M]`

```ts
type ModulePacketPage = {
  version: 1;
  requestId: string;
  subject: {
    runId: string; nodeId: string; branchId: string; runSeq: number;
    timing: ModuleTiming; candidateUci?: string; rulesReceipt: string;
  };
  effective: { presetId: string; moduleIds: readonly string[]; capabilityDigest: string };
  packets: readonly {
    moduleId: string;
    seatClass: string;
    state: "content" | "empty" | "unavailable" | "suppressed";
    items: readonly unknown[];
    budgets: { maxFacts: number; maxWords: number; maxMarks: number | null; maxArrows: number };
    noveltyAbstained: boolean;
  }[];
};
```

The `items` type is deliberately not invented here. It must be the exact sealed component wire
from the returned `evidence-presentation`/adapter contract, with a client parser that rejects extra
fields, unknown components, evidence-owner mismatch and digest mismatch. Raw sentence arrays are
not an acceptable placeholder. `[V]` `design/research/sealed-component-adapter.md`;
`planning/platform-alignment/evidence-presentation/independent-buildability-review-2026-08-26.md`.

Route closure must exercise application router → REST parser → service subject derivation → F1
admission → reducers → registered renderer/component adapter → closed wire → client parser/cache →
one occupied seat. An anchor census or direct service test cannot discharge [[D1588]]. `[M]`

## One shared staged-move protocol

The executable prototype uses these states:

```text
idle → checking(generation, exact UCI, restore receipt)
          ├─ honest empty → committing → authoritative success → idle
          ├─ concrete risk → warning → confirm → committing
          │                         └→ revise → restore input/focus → idle
          └─ source failure → unavailable → explicit confirm or revise
new gesture / revise increments generation; late responses are ignored
```

It passes click, drag, touch, keyboard-grid and text candidates; risk, honest-empty and provider
failure; exact-once confirmation; stale response rejection; input/focus restore receipt; and
promotion-before-stage. `[V]` `tools/d1588-module-delivery-harness/module-delivery.test.ts` (9/9).

The production controller should rename the current result from committed move to **candidate**.
Today `BoardInputController.#commit` writes *"Move committed: …"*, `Chessboard.apply` forwards the
announcement before awaiting `onMove`, and its settle callback runs in `finally`. A rejected
network mutation can therefore remain announced as committed. Commitment is an authoritative
server result and its announcement belongs after success; risk-source failure is a stated
unavailable state, never an implicit all-clear. `[V]` `apps/web/src/lib/board-input.ts:380-389`,
`apps/web/src/lib/Chessboard.svelte:139-153`.

The restore receipt is not cosmetic. Before the final action, the shared controller still knows
origin, active square and input mode; text additionally needs its value/focus. On revise the board
must reset Chessground to the unchanged authoritative FEN, restore the controller snapshot and
focus the originating surface. Five separate warning interceptors would lose this common state and
reopen the accessibility parity defect. `[V]` Harness restore arms; `Chessboard.svelte` already
has `resetToken`, retained active-square and focus-restoration seams at `:47-51,294-309`.

## Required amendment and verification

The returned RFC should add:

1. the exact route/action, request union, response receipt and error/refusal vocabulary;
2. server-derived subject/config/capability authority and no client FEN/history;
3. one invocation and invalidation rule for every timing, including the pre-opponent post-commit
   anchor;
4. the component-wire dependency rather than raw strings;
5. one candidate/staging controller shared by all input modes, with promotion first;
6. generation-token stale response refusal, exact-once commit, revise restore and honest provider
   failure;
7. success announcements only after the authoritative mutation;
8. a permanent matrix over 5 input modes × risk/empty/unavailable × confirm/revise, plus promotion,
   stale response, server rejection, focus restore and pixel-identical board-edge assertions;
9. route-to-seat tests for provider-off, disclosure-closed, role-refused and evidence-dark subjects.

This pass does not authorize production work before `module-registration`, the component wire and
its hint/preset dependencies return accepted. It does remove the two implementation ambiguities:
where the operation lives and where every input mode converges. `[V]`
