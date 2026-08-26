const claims = new Map<HTMLElement, { count: number; wasInert: boolean }>();

function claim(element: HTMLElement): void {
  const current = claims.get(element);
  if (current !== undefined) {
    current.count += 1;
    return;
  }
  claims.set(element, { count: 1, wasInert: element.inert });
  element.inert = true;
}

function release(element: HTMLElement): void {
  const current = claims.get(element);
  if (current === undefined) return;
  current.count -= 1;
  if (current.count > 0) return;
  element.inert = current.wasInert;
  claims.delete(element);
}

function backgroundSiblings(node: HTMLElement): HTMLElement[] {
  const background: HTMLElement[] = [];
  let branch: HTMLElement = node;
  while (branch.parentElement !== null) {
    const parent = branch.parentElement;
    for (const child of parent.children) {
      if (child !== branch && child instanceof HTMLElement) background.push(child);
    }
    branch = parent;
    if (parent === document.body) break;
  }
  return background;
}

function tabbable(node: HTMLElement): HTMLElement[] {
  return [...node.querySelectorAll<HTMLElement>(
    'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.inert && element.getAttribute("aria-hidden") !== "true" && element.tabIndex >= 0);
}

/** One modal boundary: background inertness and circular Tab ownership. Escape stays with the owning workflow. */
export function modalBoundary(node: HTMLElement): { destroy(): void } {
  const background = backgroundSiblings(node);
  for (const element of background) claim(element);

  const keydown = (event: KeyboardEvent): void => {
    if (event.key !== "Tab") return;
    const candidates = tabbable(node);
    if (candidates.length === 0) {
      event.preventDefault();
      node.focus();
      return;
    }
    const first = candidates[0]!;
    const last = candidates.at(-1)!;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !node.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !node.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };
  node.addEventListener("keydown", keydown);

  return {
    destroy(): void {
      node.removeEventListener("keydown", keydown);
      for (const element of background) release(element);
    },
  };
}
