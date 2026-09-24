// rfc/safe-deployment-profiles.md §§1–7 — the closed deployment boundary.
//
// Three supported network postures, compiled once at startup from a closed set of selectors:
//   local     — HTTP on loopback only; unprefixed, non-Secure session cookie.
//   appliance — HTTPS behind the bundled Caddy with its internal CA on a LAN hostname.
//   hosted    — HTTPS behind the bundled Caddy with publicly trusted (ACME) TLS.
// A hybrid (HTTP origin with a Secure cookie, a proxied profile with an insecure cookie, a hostname
// on local, …) is refused before storage or HTTP opens. Outside development the profile is
// REQUIRED: the packaged defaults never silently choose insecure cookies.

export type DeploymentProfile = "local" | "appliance" | "hosted";

export interface DeploymentBoundary {
  readonly profile: DeploymentProfile;
  /** The canonical public origin absolute links and the Origin policy use. */
  readonly publicOrigin: string;
  /** Every origin an unsafe browser request may carry (local admits both loopback spellings). */
  readonly allowedOrigins: readonly string[];
  /** Every Host/:authority value a request may carry. */
  readonly allowedHosts: readonly string[];
  /** Interface the Node listener binds. */
  readonly listenHost: string;
  readonly listenPort: number;
  /** Proxied profiles require the bundled Caddy's X-Forwarded-Proto/Host on every request. */
  readonly behindBundledProxy: boolean;
  readonly secureCookie: boolean;
  /** `__Host-tabiya_session` over HTTPS; `tabiya_session` over local HTTP. */
  readonly cookieName: string;
  /** Unsafe requests without an Origin header are admitted only on loopback-local. */
  readonly requireOrigin: boolean;
}

export class DeploymentConfigError extends TypeError {
  constructor(readonly code: "PROFILE_REQUIRED" | "PROFILE_UNKNOWN" | "PROFILE_HYBRID_REFUSED" | "HOSTNAME_INVALID" | "PORT_INVALID" | "LISTEN_HOST_INVALID", message: string) {
    super(`${code}: ${message}`);
  }
}

function port(value: string | undefined, fallback: number, name: string): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 65_535 || (value !== undefined && String(parsed) !== value)) {
    throw new DeploymentConfigError("PORT_INVALID", `${name} must be an integer 1-65535`);
  }
  return parsed;
}

/**
 * Lower-case ASCII DNS name, 1–63 byte labels, ≤253 bytes, at least two labels, no wildcard,
 * underscore, IP literal, trailing dot, `.local` or `.localhost` (§1).
 */
export function parsePublicHostname(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 253) throw new DeploymentConfigError("HOSTNAME_INVALID", "hostname is missing or too long");
  const labels = value.split(".");
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(label))) {
    throw new DeploymentConfigError("HOSTNAME_INVALID", `${JSON.stringify(value)} is not a lower-case DNS hostname`);
  }
  if (/^\d+$/u.test(labels.at(-1)!)) throw new DeploymentConfigError("HOSTNAME_INVALID", "IP literals are refused; use a DNS hostname");
  if (value.endsWith(".local") || value.endsWith(".localhost") || value === "localhost") throw new DeploymentConfigError("HOSTNAME_INVALID", ".local/.localhost names are refused; use operator-managed DNS");
  return value;
}

const LISTEN_HOSTS = new Set(["127.0.0.1", "::1", "0.0.0.0", "::"]);

/**
 * Compiles the boundary from the process environment. `TABIYA_COOKIE_SECURE` is no longer an
 * authority: when present it must agree with the profile or startup refuses the hybrid.
 */
export function deploymentBoundaryFromEnv(env: NodeJS.ProcessEnv, options: { readonly development: boolean }): DeploymentBoundary {
  const raw = env.TABIYA_DEPLOYMENT_PROFILE;
  if (raw === undefined && !options.development) {
    throw new DeploymentConfigError("PROFILE_REQUIRED", "set TABIYA_DEPLOYMENT_PROFILE to local, appliance or hosted (docs/deployment.md)");
  }
  const profile = raw ?? "local";
  if (profile !== "local" && profile !== "appliance" && profile !== "hosted") {
    throw new DeploymentConfigError("PROFILE_UNKNOWN", `unsupported TABIYA_DEPLOYMENT_PROFILE ${JSON.stringify(profile)}`);
  }
  const listenPort = port(env.PORT, 3000, "PORT");
  const listenHost = env.TABIYA_LISTEN_HOST ?? (profile === "local" ? "127.0.0.1" : "0.0.0.0");
  if (!LISTEN_HOSTS.has(listenHost)) throw new DeploymentConfigError("LISTEN_HOST_INVALID", "TABIYA_LISTEN_HOST must be 127.0.0.1, ::1, 0.0.0.0 or ::");
  let boundary: DeploymentBoundary;
  if (profile === "local") {
    if (env.TABIYA_PUBLIC_HOSTNAME !== undefined) throw new DeploymentConfigError("PROFILE_HYBRID_REFUSED", "local serves loopback HTTP only; TABIYA_PUBLIC_HOSTNAME belongs to appliance/hosted");
    const publicPort = port(env.TABIYA_PUBLIC_PORT, listenPort, "TABIYA_PUBLIC_PORT");
    const hosts = [`127.0.0.1:${publicPort}`, `localhost:${publicPort}`];
    boundary = {
      profile,
      publicOrigin: `http://127.0.0.1:${publicPort}`,
      allowedOrigins: hosts.map((host) => `http://${host}`),
      allowedHosts: hosts,
      listenHost,
      listenPort,
      behindBundledProxy: false,
      secureCookie: false,
      cookieName: "tabiya_session",
      requireOrigin: false,
    };
  } else {
    if (env.TABIYA_PUBLIC_PORT !== undefined) throw new DeploymentConfigError("PROFILE_HYBRID_REFUSED", `${profile} serves https on 443; TABIYA_PUBLIC_PORT belongs to local`);
    const hostname = parsePublicHostname(env.TABIYA_PUBLIC_HOSTNAME);
    boundary = {
      profile,
      publicOrigin: `https://${hostname}`,
      allowedOrigins: [`https://${hostname}`],
      allowedHosts: [hostname],
      listenHost,
      listenPort,
      behindBundledProxy: true,
      secureCookie: true,
      cookieName: "__Host-tabiya_session",
      requireOrigin: true,
    };
  }
  const legacyCookie = env.TABIYA_COOKIE_SECURE;
  if (legacyCookie !== undefined && legacyCookie !== String(boundary.secureCookie)) {
    throw new DeploymentConfigError("PROFILE_HYBRID_REFUSED", `TABIYA_COOKIE_SECURE=${legacyCookie} contradicts the ${profile} profile; remove it`);
  }
  return Object.freeze({ ...boundary, allowedOrigins: Object.freeze([...boundary.allowedOrigins]), allowedHosts: Object.freeze([...boundary.allowedHosts]) });
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PROBE_PATHS = new Set(["/healthz", "/readyz"]);

function refusal(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers: { "cache-control": "no-store" } });
}

/**
 * The transport boundary applied before static or API routing (§§6–7): Host/authority, bundled
 * proxy headers, and the Origin/Fetch-Metadata policy for every unsafe method. Liveness and
 * readiness probes are exempt (orchestrators and Caddy address the container directly) and reveal
 * nothing sensitive.
 */
export function deploymentRefusal(boundary: DeploymentBoundary, request: Request): Response | undefined {
  const url = new URL(request.url);
  if (PROBE_PATHS.has(url.pathname) && (request.method === "GET" || request.method === "HEAD")) return undefined;
  if (!boundary.allowedHosts.includes(url.host)) return refusal(421, "MISDIRECTED_REQUEST", "This host name is not served here");
  if (boundary.behindBundledProxy) {
    if (request.headers.get("x-forwarded-proto") !== "https" || !boundary.allowedHosts.includes(request.headers.get("x-forwarded-host") ?? "")) {
      return refusal(421, "MISDIRECTED_REQUEST", "Requests must arrive through the bundled HTTPS proxy");
    }
  }
  if (UNSAFE_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    if (origin === null ? boundary.requireOrigin : !boundary.allowedOrigins.includes(origin)) {
      return refusal(403, "ORIGIN_REFUSED", "Cross-origin writes are refused");
    }
    const site = request.headers.get("sec-fetch-site");
    if (site !== null && site !== "same-origin") return refusal(403, "ORIGIN_REFUSED", "Cross-site writes are refused");
  }
  return undefined;
}
