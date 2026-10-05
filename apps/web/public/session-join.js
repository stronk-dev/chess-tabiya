// A same-origin module, not executable token interpolation in the invitation HTML.
const form = document.getElementById("join-form");
const error = document.getElementById("join-error");

if (form instanceof HTMLFormElement && error !== null) {
  let busy = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const action = event.submitter?.value ?? "login";
    const token = form.dataset.invitationToken;
    if ((action !== "login" && action !== "register") || !token) {
      error.textContent = "This invitation is no longer available.";
      return;
    }
    const fields = new FormData(form);
    const buttons = [...form.querySelectorAll('button[type="submit"]')];
    busy = true;
    error.textContent = "";
    form.setAttribute("aria-busy", "true");
    for (const button of buttons) button.disabled = true;
    try {
      const credentials = await fetch(`/auth/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: fields.get("handle"), password: fields.get("password") }),
      });
      if (!credentials.ok) {
        error.textContent = "Those account details were not accepted.";
        return;
      }
      const joined = await fetch(`/api/shared/${encodeURIComponent(token)}/join`, { method: "POST" });
      if (!joined.ok) {
        error.textContent = "This invitation is no longer available.";
        return;
      }
      const result = await joined.json();
      if (typeof result?.session?.id !== "string" || result.session.id.length === 0) {
        error.textContent = "This invitation is no longer available.";
        return;
      }
      location.assign(`/live/session/${encodeURIComponent(result.session.id)}`);
    } catch {
      error.textContent = "Could not connect. Check your connection and try again.";
    } finally {
      busy = false;
      form.removeAttribute("aria-busy");
      for (const button of buttons) button.disabled = false;
    }
  });
}
