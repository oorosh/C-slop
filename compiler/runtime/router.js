/**
 * C-slop Router Runtime
 * Client-side routing with reactive $route signal
 */

import { signal } from './signals.js';

// Global route state
export const $route = signal({
  path: '/',
  params: {},
  query: {}
});

// Route definitions (populated by compiled router)
let routes = [];

export function defineRoutes(routeDefs) {
  routes = routeDefs;
}

export function createRouter(target) {
  const render = () => {
    const path = window.location.pathname;
    const match = matchRoute(path);

    if (match) {
      $route.value = {
        path,
        params: match.params,
        query: parseQuery(window.location.search)
      };

      // Clear and render component
      target.innerHTML = '';
      const component = match.component;
      const renderFn = component();
      const el = renderFn();

      if (Array.isArray(el)) {
        el.forEach(e => e instanceof Node && target.appendChild(e));
      } else if (el instanceof Node) {
        target.appendChild(el);
      }
    }
  };

  // Listen for navigation
  window.addEventListener('popstate', render);

  // Initial render
  render();

  return { render };
}

function matchRoute(path) {
  for (const route of routes) {
    const match = matchPath(route.path, path);
    if (match) {
      return { component: route.component, params: match.params };
    }
  }
  return null;
}

function matchPath(pattern, path) {
  const patternParts = pattern.split('/').filter(p => p);
  const pathParts = path.split('/').filter(p => p);

  // Handle root path specially
  if (pattern === '/' && path === '/') {
    return { params: {} };
  }

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return { params };
}

function parseQuery(search) {
  const query = {};
  if (!search || search === '?') return query;

  const params = new URLSearchParams(search);
  params.forEach((value, key) => {
    query[key] = value;
  });

  return query;
}

// Re-export navigate from dom.js for convenience
export { navigate } from './dom.js';
