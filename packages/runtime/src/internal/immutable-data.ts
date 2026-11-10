// Cache eligibility only. This neither freezes data nor issues source/access authority.
const immutableImages = new WeakSet<object>();
export function isImmutableOwnData(value: unknown): boolean {
  const active = new WeakSet<object>();
  const visit = (child: unknown): boolean => {
    if (child === null || typeof child !== "object") return typeof child !== "function";
    if (immutableImages.has(child)) return true;
    if (!Object.isFrozen(child) || active.has(child)) return false;
    const prototype = Object.getPrototypeOf(child);
    if (Array.isArray(child) ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) return false;
    if (Array.isArray(child)) for (let index = 0; index < child.length; index++) if (!Object.hasOwn(child, index)) return false;
    active.add(child);
    try {
      for (const name of Reflect.ownKeys(child)) {
        const field = Object.getOwnPropertyDescriptor(child, name)!;
        if (!("value" in field) || !visit(field.value)) return false;
      }
    } finally { active.delete(child); }
    immutableImages.add(child); return true;
  };
  return visit(value);
}
