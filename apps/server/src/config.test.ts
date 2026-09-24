import { describe, expect, it } from "vitest";

import { deploymentBoundaryFromEnv, deploymentRefusal, parsePublicHostname, type DeploymentBoundary } from "./config.js";

const compile = (env: Record<string, string>, development = false) => deploymentBoundaryFromEnv(env, { development });

describe("safe deployment profiles — the closed boundary (rfc/safe-deployment-profiles.md §§1–7)", () => {
  it("requires an explicit profile outside development and defaults development to loopback local", () => {
    expect(() => compile({})).toThrow(/PROFILE_REQUIRED/u);
    expect(compile({}, true)).toMatchObject({ profile: "local", publicOrigin: "http://127.0.0.1:3000", listenHost: "127.0.0.1", secureCookie: false, cookieName: "tabiya_session" });
    expect(() => compile({ TABIYA_DEPLOYMENT_PROFILE: "public" })).toThrow(/PROFILE_UNKNOWN/u);
  });

  it("derives Secure __Host- cookies and an https origin for both proxied profiles", () => {
    for (const profile of ["appliance", "hosted"] as const) {
      const boundary = compile({ TABIYA_DEPLOYMENT_PROFILE: profile, TABIYA_PUBLIC_HOSTNAME: "tabiya.example.org" });
      expect(boundary).toMatchObject({
        profile, publicOrigin: "https://tabiya.example.org", secureCookie: true, cookieName: "__Host-tabiya_session",
        behindBundledProxy: true, requireOrigin: true, listenHost: "0.0.0.0", allowedHosts: ["tabiya.example.org"],
      });
    }
  });

  it("refuses every hybrid: insecure cookie on a proxied profile, secure cookie on local HTTP, crossed selectors", () => {
    expect(() => compile({ TABIYA_DEPLOYMENT_PROFILE: "hosted", TABIYA_PUBLIC_HOSTNAME: "a.example.org", TABIYA_COOKIE_SECURE: "false" })).toThrow(/PROFILE_HYBRID_REFUSED/u);
    expect(() => compile({ TABIYA_DEPLOYMENT_PROFILE: "local", TABIYA_COOKIE_SECURE: "true" })).toThrow(/PROFILE_HYBRID_REFUSED/u);
    expect(() => compile({ TABIYA_DEPLOYMENT_PROFILE: "local", TABIYA_PUBLIC_HOSTNAME: "a.example.org" })).toThrow(/PROFILE_HYBRID_REFUSED/u);
    expect(() => compile({ TABIYA_DEPLOYMENT_PROFILE: "appliance", TABIYA_PUBLIC_HOSTNAME: "a.example.org", TABIYA_PUBLIC_PORT: "8443" })).toThrow(/PROFILE_HYBRID_REFUSED/u);
    expect(() => compile({ TABIYA_DEPLOYMENT_PROFILE: "appliance" })).toThrow(/HOSTNAME_INVALID/u);
    // A consistent legacy value is tolerated; it is no longer an authority.
    expect(compile({ TABIYA_DEPLOYMENT_PROFILE: "local", TABIYA_COOKIE_SECURE: "false" }).secureCookie).toBe(false);
  });

  it.each(["Tabiya.example.org", "*.example.org", "tabiya", "192.168.1.10", "tabiya.local", "a_b.example.org", "tabiya.example.org.", "-a.example.org", "localhost"])(
    "refuses the hostname %s", (hostname) => {
      expect(() => parsePublicHostname(hostname)).toThrow(/HOSTNAME_INVALID/u);
    },
  );

  it("binds local to the published port's loopback origins and never to a LAN host", () => {
    const boundary = compile({ TABIYA_DEPLOYMENT_PROFILE: "local", PORT: "3000", TABIYA_PUBLIC_PORT: "8080", TABIYA_LISTEN_HOST: "0.0.0.0" });
    expect(boundary.allowedOrigins).toEqual(["http://127.0.0.1:8080", "http://localhost:8080"]);
    expect(() => compile({ TABIYA_DEPLOYMENT_PROFILE: "local", TABIYA_LISTEN_HOST: "192.168.1.2" })).toThrow(/LISTEN_HOST_INVALID/u);
    expect(() => compile({ TABIYA_DEPLOYMENT_PROFILE: "local", PORT: "70000" })).toThrow(/PORT_INVALID/u);
  });
});

describe("transport boundary — Host, proxy headers and Origin policy", () => {
  const local = compile({ TABIYA_DEPLOYMENT_PROFILE: "local", PORT: "3000" });
  const hosted = compile({ TABIYA_DEPLOYMENT_PROFILE: "hosted", TABIYA_PUBLIC_HOSTNAME: "tabiya.example.org" });
  const request = (url: string, init: RequestInit = {}) => new Request(url, init);
  const status = (boundary: DeploymentBoundary, value: Request) => deploymentRefusal(boundary, value)?.status ?? 200;
  const proxied = { "x-forwarded-proto": "https", "x-forwarded-host": "tabiya.example.org" };

  it("refuses a wrong Host with 421 but always answers the liveness/readiness probes", () => {
    expect(status(local, request("http://192.168.1.4:3000/api/packs"))).toBe(421);
    expect(status(local, request("http://127.0.0.1:3000/api/packs"))).toBe(200);
    expect(status(local, request("http://localhost:3000/"))).toBe(200);
    expect(status(hosted, request("http://app:3000/healthz"))).toBe(200);
    expect(status(hosted, request("http://app:3000/readyz"))).toBe(200);
    expect(status(hosted, request("http://app:3000/readyz", { method: "POST", body: "x" }))).toBe(421);
  });

  it("requires the bundled proxy's forwarded proto and host in proxied profiles", () => {
    expect(status(hosted, request("http://tabiya.example.org/api/packs"))).toBe(421);
    expect(status(hosted, request("http://tabiya.example.org/api/packs", { headers: { "x-forwarded-proto": "http", "x-forwarded-host": "tabiya.example.org" } }))).toBe(421);
    expect(status(hosted, request("http://tabiya.example.org/api/packs", { headers: { "x-forwarded-proto": "https", "x-forwarded-host": "evil.example.org" } }))).toBe(421);
    expect(status(hosted, request("http://tabiya.example.org/api/packs", { headers: proxied }))).toBe(200);
  });

  it("refuses cross-origin and cross-site unsafe requests before routing; exact-origin writes pass", () => {
    const post = (boundary: DeploymentBoundary, url: string, headers: Record<string, string>) => status(boundary, request(url, { method: "POST", headers, body: "{}" }));
    expect(post(hosted, "http://tabiya.example.org/auth/login", { ...proxied, origin: "https://tabiya.example.org", "sec-fetch-site": "same-origin" })).toBe(200);
    expect(post(hosted, "http://tabiya.example.org/auth/login", { ...proxied })).toBe(403);
    expect(post(hosted, "http://tabiya.example.org/auth/login", { ...proxied, origin: "https://evil.example.org" })).toBe(403);
    expect(post(hosted, "http://tabiya.example.org/auth/login", { ...proxied, origin: "https://tabiya.example.org", "sec-fetch-site": "same-site" })).toBe(403);
    expect(post(local, "http://127.0.0.1:3000/auth/login", { origin: "http://evil.example.org" })).toBe(403);
    expect(post(local, "http://127.0.0.1:3000/auth/login", { origin: "http://127.0.0.1:3000", "sec-fetch-site": "cross-site" })).toBe(403);
    // Browsers always attach Origin to unsafe requests; loopback-local admits a non-browser client.
    expect(post(local, "http://127.0.0.1:3000/auth/login", {})).toBe(200);
    // Safe cross-site navigation (an invitation link) still renders.
    expect(status(hosted, request("http://tabiya.example.org/join/abc", { headers: { ...proxied, "sec-fetch-site": "cross-site" } }))).toBe(200);
  });
});
