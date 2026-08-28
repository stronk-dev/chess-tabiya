# D1916 assistance-register review harness

Disposable process/buildability instrument under `rfc/0000-rfc-process.md` §Exploration gate. It
reproduces the proposed C9 drift exception, then executes the amended always-equal head/digest
contract across same-head drift, head-only drift, atomic next-head landing and unchanged-tree
reservation. It carries two nonblocking controls for the already-routed D1629 browser persistence
seam. It is not production code.

Run from the repository root:

```sh
make assistance-register-contract
```

The stable target uses the Node-24 form of the seven-arm contract; the original Vitest source is
retained as the historical review instrument.
