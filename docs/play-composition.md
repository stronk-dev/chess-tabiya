# Play composition

The live run is a focused, viewport-owned surface. It deliberately omits the application's global
navigation bar while `/play/run/:runId` is active; the run topbar provides identity, access state,
Inspector, assistance and a Tabiya exit back to Play.

## Stable stage

The board edge is computed by `playBoardEdge(width, height)` from viewport dimensions and fixed
composition tokens only. The result rounds down to a multiple of eight. Pack text, evidence,
branches, menus and opened overlays are not inputs to that function.

The stage's layout children are closed:

- the board frame;
- the fixed 40 px timeline strip; and
- on tablet and phone, the fixed 32 px objective line.

Text move entry, promotion, errors, read-only notices, objectives, checkpoints and dialogs overlay
the composition. They never add a stage row. The Chessground DOM node also survives committed
moves; position changes use the component's `board.set()` path.

## Companion and Inspector

Desktop uses a fixed 336 px companion rail. Tablet uses a fixed 176 px band. Phone keeps a 48 px
rim in layout and expands its companion as an overlay sheet. Support, Branches and Actions form one
queue: exactly one structural seat is expanded, Support is the ordinary default, a consequence guard
selects Support, and creating a branch or branch group selects Branches. On phone, branch creation
selects the seat without covering the board before the learner's next move.

Inside Support, the learner-module seats (`ModuleSeats.svelte`) exist only for modules the finalized
help style composed with a play-timing effect. Each seat is a badged row (the badge is the delivered
fact count; an on-request row carries no count before it is opened), expands to its card, or stays
quiet when honestly empty; at most one seat is expanded. The Staged-move risk check owns the one
board-adjacent head slot and appears only while a staged move is held for Revise or play-anyway.
Every seat renders only sealed presentation components from the module query, and board paint is
the expanded seat's own facts. Guided Hint uses its own hint-distance delivery protocol but the
same expansion authority: opening it collapses the other module card and vice versa. A collapsed
hint keeps its exact decision and rung while hiding both its card and board marks. Reopening it
does not request another hint; only **Hint** or **A little more** advances the disclosure.

On tablet, `CompanionSeat.svelte` keeps those same controllers mounted while placing the one
expanded card above a single selector row. Only the card scrolls; Support itself cannot grow or
scroll around the fixed 176 px band. Short selector labels retain their full accessible names and
receipt-bound badges. **More** opens the existing support promise, temporary reveal and other
support tools in that same head. It is a named controls group within Support, not a second
Support landmark, evidence module or producer.
An unanswered selector does not invent a fact count. The held risk cue temporarily owns the head;
Revise restores the learner's previous card. Desktop/phone retain their ordinary rail/sheet layout.

A held staged cue displaces both ordinary module cards and Guided Hint; its own badge counts the
receipt's delivered facts. Revise restores ordinary expansion. The selected origin-square answer
survives staging because the move has not been committed. Opening disclosure waits for the new
assistance compilation before requesting proactive nudge/structure packets. Selected-square
requests use the exact run/node/square/configuration identity, not unrelated snapshot updates.
Late proactive packets fill their badges without closing a learner-selected card, including More
while its reveal/control interaction is underway. Unselected default/Nudge heads still auto-expand.
A genuine consequence guard selects More and puts its prompt before generic controls;
an identical run/sequence snapshot does not repeat that selection. A new guard still does.

On compact screens the help-style popover is inset from both viewport edges, independently of
its topbar trigger. Its declared scroll region bounds long preset text without displacing the board
or putting radio controls outside the phone viewport.

Raw position structure, transition census, human-model candidates and corpus counts are available
only in the explicit full-screen Evidence Inspector. Ordinary play does not render those diagnostic
readings as a hint stream. The attempt-complete dialog follows the same boundary: it keeps the
outcome, authored commentary and return actions in view, while an explicit “Inspect recorded
evidence” door opens the exact terminal engine/tablebase records in the Inspector.

Ordinary move copy has one final boundary: it renders SAN or honest unavailable copy. It never
falls back to the run's UCI identity when SAN is absent; raw move identities remain Inspector/export
data.

The same boundary applies before the attempt ends. Branches, branch groups, Support and checkpoint
sheets share learner-facing labels for objective progress and game outcomes. They describe where
candidates came from and which resistance was requested or played, but do not expose runtime enum
bytes, engine/model versions or selector bookkeeping. The Inspector's Attempt conditions section
retains the exact root-assessment, provider and per-ply resistance record for deliberate inspection.

Objective-change banners follow that split as well: Support receives a deterministic family-level
reason, while Inspector retains the exact references, source labels and sentences. Phase chrome
collapses matching authored/detected phases to one readable label and explains genuine differences.
Text entry is labelled as chess notation even though its controller continues to accept both SAN
and coordinate input. The temporary reveal is named for the support it affords, not its evidence
transport, and comparison navigation speaks in positions rather than runtime ply terminology.

## Verification

The browser suite asserts the exact board rectangle at the seven accepted projections:
1440×900, 1366×768, 1280×720, 768×1024, 430×932, 390×844 and 360×680. It remeasures after opening
text entry, Inspector, objective overlays and the phone companion sheet. It separately verifies
stable board identity after a committed move, permanent pointer/touch/keyboard/text input and
multi-user match behavior.

A module-seat matrix covers composition states 3 (staged move with the head-slot cue, followed by a
real move submission), 5 (a rail module expanded), 9 (honest-empty and not-consulted states) and 13
(max load) at all seven projections with the board rectangle unchanged. State 13 activates the
complete eight-seat population through actual Advanced controls, records two attempts, requests
every on-request answer and independently verifies all delivered-fact badges. Native card swaps,
the held cue's displacement and Revise, real square hit targets, tablet band/phone rim tokens and
unchanged board geometry are asserted. `make play-composition-max-load-check` runs that journey.
`make play-composition-tablet-check` also tests the head/row bounds and native selector center hits
for Hint, every ordinary card, the warning and More. It checks header separation at 720, 768, 820
and 1023 px, including an intentionally overlapping negative control. The real header already
passes; the test is new coverage, not evidence of a shipped header collision.
The current phone companion is modal: close it before board gestures, reopen it to inspect the
answer. D3436 retains the unresolved contract reconciliation with the later no-overlay floor.

State 6 uses the actual hint request/poll protocol through the preset's final permitted `distance`
rung. At every projection it checks one expanded seat, board stability, collapse/reopen without
another request, and removal/restoration of the hint's real board marks. It does not change the
proposed ceiling table or reveal a direct move.
The tablet projection additionally resizes to desktop and back, proving the same mounted Hint
controller, rung, marks and request count survive. Mounted frame tests preserve control drafts
through responsive/collapse transitions and retain native disabled-button behavior.

`make test-browser-matrix` and `make test-browser` require all 112 distinct current-run successful,
unretried PNG attachments. The JSON report, attachment dimensions and closed cell names are checked
by `tools/play-composition-matrix.mjs`. The validated matrix is copied to a report-digest-bound
directory under `test-results/composition/`, which survives later browser tiers and is included in
CI's always-uploaded evidence. `make play-composition-matrix-contract` tests missing, duplicate,
foreign, failed, retried, wrong-size and escaped attachments; synthetic PNG containers test the
verifier, never substitute for real browser screenshots.

The RFC remains implementing. A complete screenshot population does not prove every A3 hit target,
A4 vocabulary destination, every-module max-load conformance, proposed ceiling, or owner-use
discharge; the remaining obligations still gate archival.
