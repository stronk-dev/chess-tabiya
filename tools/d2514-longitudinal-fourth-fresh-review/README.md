# Longitudinal store fourth-repair fresh review harness

Disposable acceptance falsifier for [[D2514]]–[[D2517]]. It verifies the live contract and
production composition currently retain four blockers: multi-cut status cardinality, isolated
default in-memory databases, an undefined source-digest byte image, and a worker lifecycle/build
artifact that is not joined to the shipped application.

Run with:

```sh
make longitudinal-store-fourth-fresh-review
```

Passing means the blockers are reproduced at the reviewed tree. It is not an implementation gate
and should become red when an author repair closes the findings.
