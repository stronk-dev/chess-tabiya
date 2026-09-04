# Candidate packet seventh author repair

Disposable author contract for [[D2625]]–[[D2627]]. It does not implement the packet.

`make candidate-packet-seventh-author-repair` retains the sixth repair's one-factory/one-object-
graph controls and checks three new boundaries:

1. the RFC consumes the predecessor-owned exact factory and cannot recreate or co-own its adapter;
2. collector truth is independent of request scope, including direct-narrow versus projected-wide
   equivalence; and
3. cache admission measures every strong reference in the private retained graph, including quiet
   roots and hidden dependency outcomes, while deduplicating only shared object identity.

Passing is positive author evidence only. A new independent review remains required before RFC
acceptance or production implementation.
