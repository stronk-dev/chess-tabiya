// Test-only ownership of Svelte roots. Removing their DOM is not component teardown.
import { mount as svelteMount, unmount as svelteUnmount } from "svelte";
import { createClassComponent as svelteClassComponent } from "svelte/legacy";

export function createComponentTestScope() {
  const resources = new Map<object, () => void | Promise<void>>();
  const mount: typeof svelteMount = (component, options) => {
    const instance = svelteMount(component, options);
    resources.set(instance, () => svelteUnmount(instance));
    return instance;
  };
  const unmount: typeof svelteUnmount = (instance, options) => {
    resources.delete(instance);
    return svelteUnmount(instance, options);
  };
  function createClassComponent<
    Props extends Record<string, any>, Exports extends Record<string, any>,
    Events extends Record<string, any>, Slots extends Record<string, any>,
  >(options: Parameters<typeof svelteClassComponent<Props, Exports, Events, Slots>>[0]) {
    const instance = svelteClassComponent<Props, Exports, Events, Slots>(options);
    const destroy = instance.$destroy.bind(instance);
    instance.$destroy = () => { resources.delete(instance); destroy(); };
    resources.set(instance, () => instance.$destroy());
    return instance;
  }
  async function cleanup(): Promise<void> {
    const remaining = [...resources.values()];
    resources.clear();
    const errors: unknown[] = [];
    for (const dispose of remaining) {
      try { await dispose(); } catch (error) { errors.push(error); }
    }
    if (errors.length !== 0) throw new AggregateError(errors, "Component test teardown failed");
  }
  return { mount, unmount, createClassComponent, cleanup };
}
