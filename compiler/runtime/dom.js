/**
 * Minimal DOM Helpers (~1KB)
 * Hyperscript-style element creation and utilities
 */

export function h(tag, props, children) {
  const el = document.createElement(tag);

  // Set properties and event handlers
  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      if (key.startsWith('on')) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, value);
      } else if (key === 'class') {
        el.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key === 'value' && value && typeof value === 'object' && typeof value.subscribe === 'function') {
        // Handle signal-bound value for inputs - subscribe to changes
        el.value = value.value || '';
        value.subscribe(() => {
          // Only update if the value actually changed to avoid cursor jump
          if (el.value !== value.value) {
            el.value = value.value;
          }
        });
      } else if (key in el) {
        el[key] = value;
      } else {
        el.setAttribute(key, value);
      }
    });
  }

  // Append children
  if (children !== null && children !== undefined) {
    const childArray = Array.isArray(children) ? children : [children];
    childArray.forEach(child => {
      if (child === null || child === undefined) return;

      if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        el.appendChild(child);
      } else if (child.value !== undefined) {
        // Handle signals
        el.appendChild(document.createTextNode(String(child.value)));
      }
    });
  }

  return el;
}

export function mount(component, target) {
  const renderFn = component();
  const root = renderFn();
  target.appendChild(root);
}

export function list(arrayOrSignal, renderItem) {
  // Create a container div
  const container = document.createElement('div');
  container.style.display = 'contents'; // Don't affect layout

  // Function to render items
  const render = () => {
    // Get array value (either from signal or direct array)
    const array = arrayOrSignal.value !== undefined ? arrayOrSignal.value : arrayOrSignal;

    // Clear container
    container.innerHTML = '';

    // Render items
    if (Array.isArray(array)) {
      array.forEach((item, index) => {
        const result = renderItem(item, index);
        const elements = Array.isArray(result) ? result : [result];
        elements.forEach(el => {
          if (el instanceof Node) {
            container.appendChild(el);
          }
        });
      });
    }
  };

  // Initial render
  render();

  // Subscribe to changes if it's a signal
  if (arrayOrSignal && typeof arrayOrSignal.subscribe === 'function') {
    arrayOrSignal.subscribe(render);
  }

  return container;
}

export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function text(value) {
  return document.createTextNode(String(value));
}
