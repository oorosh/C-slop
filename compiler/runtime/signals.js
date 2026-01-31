/**
 * Minimal Signals Implementation (~2KB)
 * Core reactivity system for C-slop frontend
 */

let currentEffect = null;
const effectStack = [];

export function signal(value) {
  const subscribers = new Set();

  return {
    get value() {
      if (currentEffect) {
        subscribers.add(currentEffect);
      }
      return value;
    },
    set value(newValue) {
      if (value === newValue) return;
      value = newValue;
      subscribers.forEach(fn => fn());
    },
    peek() {
      return value;
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    }
  };
}

export function computed(fn) {
  const sig = signal(undefined);
  effect(() => {
    sig.value = fn();
  });
  return sig;
}

export function effect(fn) {
  const execute = () => {
    const prev = currentEffect;
    currentEffect = execute;
    effectStack.push(execute);
    try {
      fn();
    } finally {
      effectStack.pop();
      currentEffect = prev;
    }
  };
  execute();
  return execute;
}

export function batch(fn) {
  const updates = [];
  const prev = currentEffect;
  currentEffect = null;
  try {
    fn();
  } finally {
    currentEffect = prev;
    updates.forEach(update => update());
  }
}
