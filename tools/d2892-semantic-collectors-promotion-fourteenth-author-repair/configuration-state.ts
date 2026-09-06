// DISPOSABLE package-internal state for the D2892-D2896 author contract.
export type Digest = `sha256:${string}`;

export interface InventoryEntry {
  readonly generationId: string;
  readonly directory: string;
  readonly manifestDigest: Digest;
}

export interface InstalledPromotionSnapshot {
  readonly kind: "installed_promotion_configuration_snapshot";
  readonly inventoryPath: string;
  readonly inventoryRoot: string;
  readonly inventoryBytes: string;
  readonly inventoryDigest: Digest;
  readonly entries: readonly InventoryEntry[];
}

export interface InstalledPromotionConfiguration {
  readonly kind: "installed_promotion_configuration";
}

// The product model imports only this state, never the test issuer. A package export map would keep
// this file internal; the disposable contract proves the runtime authority independently of TS.
export const INSTALLED_CONFIGURATIONS = new WeakMap<object, InstalledPromotionSnapshot>();
