# Classrooms and review submissions

Classrooms organise people and assignments; they do not grant access to runs. Creating,
joining, or remaining in a classroom only permits the classroom routes. A learner grants
run access by submitting one of their own hosted runs to one assignment. That operation
is the sole classroom path that writes a `run_grants` row.

## Membership and assignments

A classroom creator is its owner and first active teacher. Teachers invite existing
learner handles as teachers or learners; the invited person must accept. A classroom is
limited to 200 current members and 20 outstanding invitations, and a learner may own 50
active classrooms. Either role can leave. Teachers can remove members, while only the
owner can archive the classroom.

Teachers assign registered packs. A due date is advisory and does not enter the learner's
spaced-repetition schedule. An optional note is stored and displayed as the teacher's
literal, attributed speech outside the run. It never enters a run snapshot, evidence
packet, explanation, or voice-provider request.

## Consent, expiry, and revocation

A learner may submit only a run they host whose `packId` matches the assignment. The
submission grants current active teachers spectator access for 90 days by default, with
an allowed range of 1–90 days. Existing independent grants are not changed or recorded
as submission grants.

Every submission records exactly the teacher grants it minted. Withdrawing the
submission, leaving or being removed, a teacher leaving, archiving the classroom, or
deleting an affected account revokes only those recorded submission grants. A direct
host grant survives those operations. Withdrawing an assignment stops new submissions
but does not revoke earlier acts of learner consent.

Expired grants are treated as absent by run lists, role checks, grant lists, live-session
lists, lease and host calculations, and the classroom access display. The `run_grants`
row remains the authority: a classroom submission may still say that it occurred while
the UI states that access was revoked or expired.

## Review assistance

A submission-minted reviewer receives the ordinary host assistance ceiling only when
all three conditions hold:

1. the run contains an `outcome.reached` event;
2. the reviewer's current grant was minted by that submission; and
3. no live session on the run is open.

The predicate is projected as `viewer.reviewing` and is used by every server guidance
route and by the client assistance controller. A manually granted spectator does not
receive it. An open live session closes the review rail; closing the session allows the
predicate to be derived again from durable consent and outcome evidence.

For a native match, `viewer.seatedInContest` is true only while the live session is open
and the learner occupies its White or Black seat. A seated host is capped exactly like a
seated guest. Closing the match removes the seat ceiling.

## Storage and routes

Storage migration 24 creates `classrooms`, `classroom_members`, `assignments`, and
`assignment_submissions`; adds `run_grants.expires_at`,
`run_grants.granted_via`, and `live_sessions.classroom_id`; and performs no run-snapshot
or pack-schema rewrite.

Authenticated routes are `/classrooms`, `/classrooms/:id`, nested `members` and
`assignments`, `/assignments`, and `/assignments/:id/submissions`. Non-members receive
the same unavailable response for unknown and inaccessible classroom or assignment ids.
The browser exposes classrooms under Live and open assignments above the learner's due
return queue under Learn.
