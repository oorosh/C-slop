/**
 * C-slop Router Code Generator
 * Generates JavaScript router configuration from parsed routes
 */

export class RouterCodeGenerator {
  constructor(routes) {
    this.routes = routes;
  }

  generate() {
    const parts = [];

    // Imports
    parts.push(`import { defineRoutes, createRouter, $route } from './router.js';`);

    // Import all components
    const uniqueComponents = [...new Set(this.routes.map(r => r.component))];
    uniqueComponents.forEach(component => {
      parts.push(`import { ${component} } from './${component}.js';`);
    });

    parts.push('');

    // Define routes
    parts.push('defineRoutes([');
    this.routes.forEach((route, index) => {
      const comma = index < this.routes.length - 1 ? ',' : '';
      parts.push(`  { path: '${route.path}', component: ${route.component} }${comma}`);
    });
    parts.push(']);');

    parts.push('');

    // Export createRouter and $route for use
    parts.push('export { createRouter, $route };');

    return parts.join('\n');
  }
}

export function generateRouterCode(routes) {
  const generator = new RouterCodeGenerator(routes);
  return generator.generate();
}
