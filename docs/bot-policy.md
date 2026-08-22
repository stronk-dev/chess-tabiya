# Bot-policy foundation

Tabiya's bot policy is a compiled, versioned composition over a human-move model. The
compiler lives in `apps/server/src/bot-policy-catalog.ts`. It keeps move policy separate
from presentation: a name, avatar, or bio cannot change a move.

The compiler currently enforces these boundaries:

- one human-policy model, sampler, guard, repertoire, memory policy, and presentation
  authority per profile;
- no learner history, rating, style, or habit input in opponent policy;
- no artificial delay, active memory instance, undisclosed engine guard, or unmeasured
  controlled trait;
- complete-vector transforms must declare the recorded base-model degraded path;
- sampler temperature is greater than zero and top-p is in `(0, 1]`;
- presentation copy cannot assert the v1 vocabulary of unmeasured playing styles.

The shipped arithmetic reconstructs Maia's played distribution from raw legal policy
mass, applies the measured temperature and top-p rule with a deterministic tie-break,
supports declared trait multipliers, and draws from the final distribution using a
caller-supplied deterministic unit value.

No production profile is registered yet. This is intentional and machine-visible as an
empty `BOT_POLICY_PROFILES`: D970 must pin the concrete band/profile roster, while D969
must pin the Stockfish candidate-pricing and typed mate contract before guarded profiles
can compile. Until those contracts land, the existing `human_common` behavior is
unchanged and no UI may advertise the new roster.

The selector request boundary already admits the eventual compiled identity as exactly
`{id, version, digest}`. It is valid only for `human_common`, cannot be combined with the
legacy `targetElo`, `temperature`, or `topP` authorities, and must match an exact compiled
catalog entry. The triple is part of the selection-cache identity. Because the production
catalog is deliberately empty, every profiled production request currently fails closed;
the selector never treats an unexecuted profile as ordinary Maia while claiming otherwise.

Stage B's candidate-evidence boundary is also implemented. `candidateFeatureVector` accepts
legal candidate moves with one finite, fixed-bound Stockfish score in the root mover's frame,
plays each move on a cloned position, and applies the existing tactical and breadth collectors
to that child and edge. Every retained result carries its literal registered projection id and
structured payload. The derived vector is admitted only to `opponent.selection@1`; it does not
flatten facts into labels or add bot-only detector code. Multi-edge sequence collectors are
honestly absent from this one-edge adapter. No personality or salience transform is thereby
registered: those remain separately measured policy layers.
