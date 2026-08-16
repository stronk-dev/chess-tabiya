# Evidence at runtime — implementation plan

1. [completed] Keep digest-current, admitted ledger readings on each `PackRecord` in a position-keyed, multi-valued projection.
2. [completed] Add recorded readings to the single-node evidence packet behind the existing disclosure gate, with live run evidence taking precedence.
3. [completed] Render readings as frozen, attributed sentences after provider rendering; never send them to the provider or expose `PackRecord` on a wire projection.
4. [completed] Publish the admitted/refused reading-kind register in capabilities and pin it against the existing instrument dispositions.
5. [completed] Re-derive the current corpus measurements and run both gates. Lifecycle closeout is the remaining archival step.

Current-tree correction: Pack Graduation left `content/packs/` empty because no pack is graduable, re-stamped all 32 ledgers, and the development registry now loads 56 draft documents. Tests derive the denominator and refused set from the committed corpus instead of freezing the RFC's earlier 53-document snapshot.
