import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "browser-security-password";

async function invitation(host: Page): Promise<{ id: string; token: string; url: string; sessionId: string }> {
  const handle = `security_host_${randomUUID().slice(0, 8)}`;
  const registered = await host.request.post("/auth/register", { data: { handle, password: PASSWORD } });
  expect(registered.status(), await registered.text()).toBe(201);
  const runId = `security-${randomUUID()}`;
  const run = await host.request.post("/runs", {
    headers: { "x-writer-id": `writer-${runId}` },
    data: {
      id: runId,
      session: { kind: "position", start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 7,
    },
  });
  expect(run.status(), await run.text()).toBe(201);
  const created = await host.request.post("/sessions", { data: { runId, kind: "academy", title: "Join this rehearsal", boardControl: "host_directed" } });
  expect(created.status(), await created.text()).toBe(201);
  const { session } = await created.json() as { session: { id: string } };
  const minted = await host.request.post(`/sessions/${session.id}/links`, { data: { invitedRole: "participant" } });
  expect(minted.status(), await minted.text()).toBe(201);
  return { ...await minted.json() as { id: string; token: string; url: string }, sessionId: session.id };
}

async function fillInvitation(page: Page, handle: string): Promise<void> {
  await expect(page.getByRole("heading", { name: "Join this rehearsal" })).toBeVisible();
  await page.getByLabel("Handle").fill(handle);
  await page.getByLabel("Password").fill(PASSWORD);
}

test("application response security covers every client route family", async ({ page }) => {
  // Parameterized routes exercise the shell even when their subject is honestly absent.
  const paths = ["/", "/play", "/review", "/rating", "/profile", "/learn", "/live", "/create", "/library", "/settings", "/campaign", "/play/run/missing", "/review/game/missing", "/live/session/missing", "/live/overlay/missing", "/play/pack/missing", "/library/shape/missing", "/library/principle/missing", "/library/opening/missing", "/campaign/missing", "/not-a-route"];
  for (const path of paths) {
    const response = await page.request.get(path, { headers: { accept: "text/html" } });
    expect(response.status(), path).toBe(200);
    expect(response.headers()["x-content-type-options"], path).toBe("nosniff");
    expect(response.headers()["referrer-policy"], path).toBe("no-referrer");
    expect(response.headers()["permissions-policy"], path).toBe("camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    expect(response.headers()["strict-transport-security"], path).toBeUndefined();
    expect(response.headers()["cache-control"], path).toBe("no-cache");
  }
  await page.goto("/play");
  await expect(page.getByRole("heading", { name: "Choose the game you want to understand." })).toBeVisible();
});

test("Rating opens directly and survives reload while its authenticated API stays JSON", async ({ page }) => {
  const handle = `security_rating_${randomUUID().slice(0, 8)}`;
  expect((await page.request.post("/auth/register", { data: { handle, password: PASSWORD } })).status()).toBe(201);
  const api = await page.request.get("/rating", { headers: { accept: "application/json" } });
  expect(api.status(), await api.text()).toBe(200);
  expect(api.headers()["content-type"]).toContain("application/json");
  expect(api.headers()["vary"]).toBe("Accept");
  await page.goto("/rating");
  await expect(page.getByRole("heading", { name: "Your measured record", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your measured record", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});

for (const action of ["register", "login"] as const) {
  test(`the served invitation module completes ${action} and joins the actual session`, async ({ page: host, browser, baseURL }) => {
    const link = await invitation(host);
    const context = await browser.newContext({ baseURL });
    try {
      const guest = await context.newPage();
      const handle = `security_guest_${randomUUID().slice(0, 8)}`;
      if (action === "login") {
        expect((await context.request.post("/auth/register", { data: { handle, password: PASSWORD } })).status()).toBe(201);
        expect((await context.request.post("/auth/logout", { data: {} })).status()).toBe(200);
      }
      const response = await guest.goto(link.url);
      expect(response?.headers()["cache-control"]).toBe("no-store");
      await expect(guest.locator("#join-form")).toHaveAttribute("method", "post");
      await expect(guest.locator('script[type="module"]')).toHaveAttribute("src", "/session-join.js");
      await expect(guest.locator("script:not([src])")).toHaveCount(0);
      await fillInvitation(guest, handle);
      await guest.getByRole("button", { name: action === "register" ? "Register and join" : "Sign in and join" }).click();
      await expect(guest).toHaveURL(new RegExp(`/live/session/${link.sessionId}$`, "u"));
      await expect(guest.getByText("your role: Participant")).toBeVisible();
      await expect(guest.getByRole("heading", { name: "Join this rehearsal" })).toBeVisible();
    } finally { await context.close(); }
  });
}

test("invitation auth refusal recovers without exposing provider or account diagnostics", async ({ page: host, browser, baseURL }) => {
  const link = await invitation(host);
  const context = await browser.newContext({ baseURL });
  try {
    const guest = await context.newPage();
    const handle = `security_retry_${randomUUID().slice(0, 8)}`;
    expect((await context.request.post("/auth/register", { data: { handle, password: PASSWORD } })).status()).toBe(201);
    expect((await context.request.post("/auth/logout", { data: {} })).status()).toBe(200);
    await guest.goto(link.url);
    await fillInvitation(guest, handle);
    await guest.getByLabel("Password").fill("wrong-account-password");
    await guest.getByRole("button", { name: "Sign in and join" }).click();
    await expect(guest.getByRole("alert")).toHaveText("Those account details were not accepted.");
    await expect(guest.getByRole("button", { name: "Sign in and join" })).toBeEnabled();
    await guest.getByLabel("Password").fill(PASSWORD);
    await guest.getByRole("button", { name: "Sign in and join" }).click();
    await expect(guest).toHaveURL(new RegExp(`/live/session/${link.sessionId}$`, "u"));
  } finally { await context.close(); }
});

test("revocation between invitation view and acceptance retains an honest refusal", async ({ page: host, browser, baseURL }) => {
  const link = await invitation(host);
  const context = await browser.newContext({ baseURL });
  try {
    const guest = await context.newPage();
    await guest.goto(link.url);
    await fillInvitation(guest, `security_revoked_${randomUUID().slice(0, 8)}`);
    expect((await host.request.post(`/sessions/${link.sessionId}/links/${link.id}`, { data: { op: "revoke" } })).status()).toBe(200);
    await guest.getByRole("button", { name: "Register and join" }).click();
    await expect(guest.getByRole("alert")).toHaveText("This invitation is no longer available.");
    await expect(guest).toHaveURL(new RegExp(`/shared/${link.token}$`, "u"));
    await expect(guest.getByRole("button", { name: "Register and join" })).toBeEnabled();
  } finally { await context.close(); }
});

test("a failed invitation connection releases the form and permits an explicit retry", async ({ page: host, browser, baseURL }) => {
  const link = await invitation(host);
  const context = await browser.newContext({ baseURL });
  try {
    const guest = await context.newPage();
    await guest.goto(link.url);
    await fillInvitation(guest, `security_network_${randomUUID().slice(0, 8)}`);
    await guest.route("**/auth/register", (route) => route.abort("connectionfailed"));
    await guest.getByRole("button", { name: "Register and join" }).click();
    await expect(guest.getByRole("alert")).toHaveText("Could not connect. Check your connection and try again.");
    await expect(guest.getByRole("button", { name: "Register and join" })).toBeEnabled();
    await guest.unroute("**/auth/register");
    await guest.getByRole("button", { name: "Register and join" }).click();
    await expect(guest).toHaveURL(new RegExp(`/live/session/${link.sessionId}$`, "u"));
  } finally { await context.close(); }
});

test("without JavaScript an invitation never puts account credentials in a GET URL", async ({ page: host, browser, baseURL }) => {
  const link = await invitation(host);
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const guest = await context.newPage();
    await guest.goto(link.url);
    await fillInvitation(guest, "security_no_script");
    const submission = guest.waitForRequest((request) => request.url().includes("/auth/login"));
    await guest.getByRole("button", { name: "Sign in and join" }).click();
    const request = await submission;
    expect(request.method()).toBe("POST");
    expect(new URL(request.url()).search).toBe("");
    expect(request.url()).not.toContain(PASSWORD);
    expect(request.postData()).toContain("password=");
    // The JSON-only auth endpoint rejects the safe fallback; it does not fabricate a join.
    await expect(guest).toHaveURL(/\/auth\/login$/u);
  } finally { await context.close(); }
});
