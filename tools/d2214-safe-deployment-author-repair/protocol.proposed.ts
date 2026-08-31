type Profile = "local" | "appliance" | "hosted";
type SecretFileRef = { readonly sourceFile: string; readonly mountName: string };
type Config = {
  readonly format: "tabiya-deployment-config";
  readonly configVersion: 1;
} & (
  | { readonly profile: "local"; readonly port?: number }
  | { readonly profile: "appliance"; readonly hostname: string; readonly resolution: { readonly kind: "operator_dns"; readonly expectedAddresses: readonly string[] } }
  | { readonly profile: "hosted"; readonly hostname: string; readonly tls: { readonly kind: "acme"; readonly contactEmail: string } }
  | { readonly profile: "hosted"; readonly hostname: string; readonly tls: { readonly kind: "files"; readonly certificate: SecretFileRef; readonly privateKey: SecretFileRef } }
);

type Operation = "command" | "check" | "start" | "probe";
type Check = "config" | "hostname_resolution" | "certificate" | "compose" | "proxy_config" | "image_pins" | "network_graph" | "origin" | "cookie" | "request_budgets" | "streaming" | "readiness" | "core_journey";
type Artifacts = { readonly deploymentRevision: string; readonly serverImageDigest: `sha256:${string}`; readonly caddyImageDigest: `sha256:${string}` | null; readonly composeDigest: `sha256:${string}`; readonly caddyConfigDigest: `sha256:${string}` | null; readonly routeBudgetManifestDigest: `sha256:${string}` };
type Base = { readonly protocol: "tabiya-deployment-admin-receipt"; readonly protocolVersion: 1; readonly operationId: string; readonly operation: Operation; readonly profile: Profile; readonly configDigest: `sha256:${string}`; readonly publicUrl: string; readonly elapsedMs: number };
type Receipt = Base & (
  | { readonly operation: "check"; readonly result: "succeeded"; readonly artifacts: Artifacts; readonly checks: readonly Check[] }
  | { readonly operation: "start"; readonly result: "succeeded"; readonly artifacts: Artifacts; readonly services: readonly ("app" | "caddy")[]; readonly checks: readonly Check[] }
  | { readonly operation: "probe"; readonly result: "succeeded"; readonly artifacts: Artifacts; readonly checks: readonly Check[] }
  | { readonly result: "refused"; readonly code: "USAGE_ERROR" | "CONFIG_REFUSED" | "PROFILE_HYBRID_REFUSED" | "SECRET_REFUSED" | "HOSTNAME_RESOLUTION_REFUSED" | "ARTIFACT_IDENTITY_REFUSED" | "PROFILE_SWITCH_REFUSED" }
  | { readonly result: "failed"; readonly code: "COMPOSE_VALIDATION_FAILED" | "PROXY_VALIDATION_FAILED" | "IMAGE_PIN_MISMATCH" | "NETWORK_GRAPH_FAILED" | "START_FAILED" | "READINESS_FAILED" | "TLS_PROBE_FAILED" | "ORIGIN_PROBE_FAILED" | "COOKIE_PROBE_FAILED" | "REQUEST_BUDGET_PROBE_FAILED" | "STREAMING_PROBE_FAILED" | "CORE_JOURNEY_FAILED" | "INTERNAL_ERROR"; readonly failedCheck: Check | null }
  | { readonly result: "cancelled"; readonly code: "OPERATION_CANCELLED"; readonly signal: "SIGINT" | "SIGTERM" }
);

const local = { format: "tabiya-deployment-config", configVersion: 1, profile: "local" } as const satisfies Config;
const appliance = { format: "tabiya-deployment-config", configVersion: 1, profile: "appliance", hostname: "tabiya.home.arpa", resolution: { kind: "operator_dns", expectedAddresses: ["192.0.2.4"] } } as const satisfies Config;
const files = { format: "tabiya-deployment-config", configVersion: 1, profile: "hosted", hostname: "chess.example", tls: { kind: "files", certificate: { sourceFile: "/run/operator/cert.pem", mountName: "tls_cert" }, privateKey: { sourceFile: "/run/operator/key.pem", mountName: "tls_key" } } } as const satisfies Config;
void [local, appliance, files];

const artifacts = { deploymentRevision: "abc", serverImageDigest: "sha256:server", caddyImageDigest: null, composeDigest: "sha256:compose", caddyConfigDigest: null, routeBudgetManifestDigest: "sha256:routes" } as const;
const base = { protocol: "tabiya-deployment-admin-receipt", protocolVersion: 1, operationId: "018f3c70-4a90-7cc6-a28a-1fcb7f474000", profile: "local", configDigest: "sha256:config", publicUrl: "http://127.0.0.1:3000", elapsedMs: 4 } as const;
void ({ ...base, operation: "check", result: "succeeded", artifacts, checks: ["config", "compose"] } satisfies Receipt);
void ({ ...base, operation: "probe", result: "failed", code: "ORIGIN_PROBE_FAILED", failedCheck: "origin" } satisfies Receipt);

// @ts-expect-error appliance config cannot omit its resolution authority
void ({ format: "tabiya-deployment-config", configVersion: 1, profile: "appliance", hostname: "tabiya.home.arpa" } satisfies Config);
// @ts-expect-error a file-certificate config requires a private key
void ({ format: "tabiya-deployment-config", configVersion: 1, profile: "hosted", hostname: "chess.example", tls: { kind: "files", certificate: { sourceFile: "/cert", mountName: "cert" } } } satisfies Config);
// @ts-expect-error a successful probe cannot omit its bound artifact identities
void ({ ...base, operation: "probe", result: "succeeded", checks: ["origin"] } satisfies Receipt);
// @ts-expect-error a failed operation names the failed check
void ({ ...base, operation: "probe", result: "failed", code: "ORIGIN_PROBE_FAILED" } satisfies Receipt);
// @ts-expect-error receipt result arms are closed
void ({ ...base, operation: "probe", result: "warning", code: "ORIGIN_PROBE_FAILED" } satisfies Receipt);
