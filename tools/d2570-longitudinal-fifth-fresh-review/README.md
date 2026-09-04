# Longitudinal-store fifth fresh review

Disposable buildability falsifier for [[D2570]]–[[D2573]]. It reviews the fifth author repair
against the live storage/application boundary. It does not implement a migration, worker, reader,
consumer, API or client.

Run:

```sh
make longitudinal-store-fifth-fresh-review
```

The four passing tests are blocker reproductions:

1. source-image inputs mutate outside the seven scheduled run writers;
2. the sole read boundary exposes three undefined row placeholders and the author models use
   `unknown[]`;
3. criterion 10 requires import-subject fields assigned to a future RFC and absent from the live
   import record; and
4. the public filter accepts ambiguous values without a parser or normalization contract.

These are review evidence, not positive implementation criteria.
