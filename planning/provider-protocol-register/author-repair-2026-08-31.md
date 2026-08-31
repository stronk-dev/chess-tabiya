# Provider-protocol register pre-review author repair — 2026-08-31

The pre-review audit found [[D2361]]: the draft represented a never-landed protocol as head 0 even
though the shared register lifecycle already distinguishes absence from a landed numeric head.

The RFC now derives absence from the missing exact future root
`packages/runtime/src/provider-protocol.ts#PROVIDER_PROTOCOL_VERSION`, records `head=absent` plus an
absent digest, permits only `first lane 1`, and refuses any landed-history→missing-root regression.
Head 0 is invalid in markers, claims, history and output. `make provider-protocol-author-repair`
passes 2/2. No checker/register/product byte changed; fresh independent review remains next.
