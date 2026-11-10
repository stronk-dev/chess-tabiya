// A pure-data optimization guard, not source/access authority. Never freeze borrowed input.
const checked = new WeakSet<object>();
export function deeplyImmutableJson(value: unknown, active = new WeakSet<object>()): boolean {
  if (value === null) return true;
  if (typeof value !== "object") return typeof value === "string" || typeof value === "boolean"
    || typeof value === "number" && Number.isFinite(value);
  if (checked.has(value)) return true;
  const prototype = Object.getPrototypeOf(value), array = Array.isArray(value);
  if (!Object.isFrozen(value) || active.has(value) || (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null)) return false;
  if (array) for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
  active.add(value);
  try {
    for (const key of Reflect.ownKeys(value)) {
      const field = Object.getOwnPropertyDescriptor(value, key)!;
      if (typeof key !== "string" || !("value" in field) || !deeplyImmutableJson(field.value, active)) return false;
    }
    checked.add(value); return true;
  } finally { active.delete(value); }
}
