/**
 * C-slop Router Parser
 * Parses router.slop files into route definitions
 *
 * Syntax:
 *   / > @@Home
 *   /about > @@About
 *   /users/:id > @@UserDetail
 */

export class RouterParser {
  constructor(source) {
    this.source = source;
    this.lines = source.split('\n');
    this.routes = [];
  }

  parse() {
    for (const line of this.lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse route: /path > @@Component
      const match = trimmed.match(/^(\/[^\s]*)\s*>\s*@@([A-Z][a-zA-Z0-9]*)/);
      if (match) {
        this.routes.push({
          path: match[1],
          component: match[2]
        });
      }
    }

    return this.routes;
  }
}

export function parseRouter(source) {
  const parser = new RouterParser(source);
  return parser.parse();
}
