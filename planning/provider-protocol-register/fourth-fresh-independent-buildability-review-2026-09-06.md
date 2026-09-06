# Provider-protocol fourth fresh independent buildability review — 2026-09-06

## Verdict

**Return.** The generic absent `canonical_resource@1` descriptor remains valid, and the third author
repair closes its four named defects. The independently accepted obligation join is still not an
accepted preimage: it can be replaced before implementation, it does not bind the ordered semantic
image the generic resource hashes, and its own wire format is incomplete.

No owner ruling is needed. These are contract/buildability defects, not provider-product choices.
The generic bootstrap dependency also remains unimplemented, so this review does not pretend to
execute the ten future lifecycle families.

## Findings

### [[D2909]] — mutable HEAD can replace the accepted preimage

The receipt authenticates only its own rows. Its `sourceRfc` is a filename and its
`obligationsDigest` is recalculated from the rows stored beside it. The product-landing rule checks
only that the receipt is already committed and is not staged in the product commit.

The executable control models two commits. Commit A accepts population A. An intervening commit B
replaces the receipt with population B and a matching self-digest. The later product commit stages
no receipt change and lands population B. Internal digest, set equality and staged-diff checks all
pass. Nothing retains A's digest or accepted Git identity. A separately protected acceptance
authority must pin the exact receipt digest/revision consumed by the product validator.

### [[D2910]] — set equality does not bind the governed ordered image

The receipt is byte-equal to the RFC metadata block, but product validation is explicitly
set-equality by complete row identity. The governed canonical resource stores arrays. Swapping two
operation rows and two domain rows therefore passes the obligation join while producing different
canonical resource bytes and a different resource digest. The contract must either require one
canonical row order plus ordered equality or govern canonical set projections rather than arrays.

### [[D2911]] — receipt wire image is not complete

The closed shape names `schema` but never supplies its literal or type. “RFC-8785 SHA-256 digest”
does not define a domain/input prefix or output grammar. The executable control constructs a
numeric-schema/`sha256:`-hex receipt and a named-schema/bare-hex receipt; both implement the stated
hashing sentence, but they cannot share a parser. One discriminant and one exact digest byte/output
contract are required, with independent reference fixtures.

## Executable evidence

`make provider-protocol-fourth-fresh-review` runs the entire historical chain and the maintained
fourth review. The new suite passes four groups:

1. the descriptor parses as the intended absent generic canonical-resource population;
2. the two-commit receipt substitution passes every stated landing check;
3. a row permutation passes set equality while changing canonical resource digest; and
4. the two incompatible receipt wire images remain admitted by the prose.

Implementation and acceptance remain unauthorized pending bounded author repair, another genuinely
fresh review and the implemented generic bootstrap.
