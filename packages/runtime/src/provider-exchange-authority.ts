/**
 * Scheduler-only subpath (`@chess-tabiya/runtime/provider-exchange-authority`).
 *
 * The sole production importer is `apps/server/src/provider-exchange.ts`; the census in
 * `provider-protocol.test.ts` fails any other importer. It is deliberately absent from the barrel.
 */
export { PROVIDER_EXCHANGE_AUTHORITY } from "./provider-exchange.js";
