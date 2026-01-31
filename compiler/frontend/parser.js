/**
 * C-slop Frontend Parser
 * Parses .ui files into AST
 */

export class Parser {
  constructor(source) {
    this.source = source;
    this.lines = source.split('\n');
    this.pos = 0;
    this.ast = {
      type: 'Component',
      state: [],
      effects: [],
      markup: null,
      actions: {}
    };
  }

  parse() {
    while (this.pos < this.lines.length) {
      const line = this.lines[this.pos].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        this.pos++;
        continue;
      }

      // State declaration
      if (line.startsWith('$')) {
        this.parseState(line);
        this.pos++;
        continue;
      }

      // Effect
      if (line.startsWith('~')) {
        this.parseEffect(line);
        this.pos++;
        continue;
      }

      // Markup (starts with element or class)
      if (line.match(/^[.#a-zA-Z]/)) {
        this.ast.markup = this.parseMarkup();
        break;
      }

      this.pos++;
    }

    return this.ast;
  }

  parseState(line) {
    // $var:value or $var := expr
    const computedMatch = line.match(/^\$(\w+)\s*:=\s*(.+)$/);
    if (computedMatch) {
      this.ast.state.push({
        name: computedMatch[1],
        initial: computedMatch[2].trim(),
        computed: true
      });
      return;
    }

    const match = line.match(/^\$(\w+)\s*:\s*(.+)$/);
    if (match) {
      this.ast.state.push({
        name: match[1],
        initial: match[2].trim(),
        computed: false
      });
    }
  }

  parseEffect(line) {
    // ~ action (where action can include > for pipelines)
    const simple = line.match(/^~\s+(.+)$/);
    if (simple) {
      const action = simple[1].trim();

      // Check if this is a conditional effect: ~ condition > action
      // But NOT a fetch pipeline: ~ fetch(...) > ...
      if (action.includes('>') && !action.includes('fetch')) {
        // Conditional effect with dependencies
        const firstArrow = action.indexOf('>');
        const deps = action.substring(0, firstArrow).trim().split(',').map(d => d.trim());
        const effectAction = action.substring(firstArrow + 1).trim();

        this.ast.effects.push({
          deps,
          action: effectAction
        });
      } else {
        // Simple effect or fetch pipeline
        this.ast.effects.push({
          deps: [],
          action
        });
      }
    }
  }

  parseMarkup() {
    const line = this.lines[this.pos].trim();
    const parentIndent = this.getIndent(this.pos);

    // Parse element definition: tag.class#id or tag.class#id[content]
    // Extract element def before [ if present
    const bracketIndex = line.indexOf('[');
    const elementDef = bracketIndex >= 0 ? line.substring(0, bracketIndex) : line;
    const element = this.parseElementDef(elementDef);

    // If has bracket, parse inline content
    if (bracketIndex >= 0) {
      const content = line.substring(bracketIndex + 1, line.lastIndexOf(']'));
      element.children = this.parseInlineContent(content);
    }

    // Parse children on next lines
    this.pos++;
    const childElements = this.parseChildren(parentIndent);
    element.children.push(...childElements);

    return element;
  }

  parseElementDef(def) {
    let tag = 'div';
    let classes = [];
    let id = null;

    // Split by . and #
    const parts = def.split(/([.#])/);

    if (parts[0] && !parts[0].match(/[.#]/)) {
      tag = parts[0];
    }

    for (let i = 1; i < parts.length; i += 2) {
      const marker = parts[i];
      const value = parts[i + 1];

      if (marker === '.') {
        classes.push(value);
      } else if (marker === '#') {
        id = value;
      }
    }

    return { type: 'Element', tag, classes, id, styles: {}, children: [] };
  }

  parseInlineContent(content) {
    const children = [];
    const parts = content.split(/(\$\w+|:\w+|@[^"]*)/);

    for (let part of parts) {
      part = part.trim();
      if (!part) continue;

      // Property access
      if (part.startsWith(':')) {
        children.push({
          type: 'PropertyAccess',
          property: part.substring(1)
        });
      }
      // Variable reference (could be binding or just reference)
      else if (part.startsWith('$')) {
        children.push({
          type: 'Variable',
          name: part
        });
      }
      // Event handler or action
      else if (part.startsWith('@')) {
        const action = part.substring(1).trim();
        children.push({
          type: 'Event',
          action
        });
      }
      // String literal
      else if (part.startsWith('"')) {
        children.push({
          type: 'Text',
          value: part.slice(1, -1)
        });
      }
      // Plain text
      else if (part) {
        children.push({
          type: 'Text',
          value: part
        });
      }
    }

    return children;
  }

  parseStyleShorthand(shorthand) {
    const styles = {};

    // Parse style shorthands like p20, m10, flex, etc.
    const parts = shorthand.split(/\s+/);

    for (const part of parts) {
      // Padding: p20 or p20,10,5,0
      if (part.match(/^p\d/)) {
        const values = part.substring(1);
        styles.padding = values.includes(',')
          ? values.split(',').map(v => v + 'px').join(' ')
          : values + 'px';
      }
      // Margin: m20
      else if (part.match(/^m\d/)) {
        const values = part.substring(1);
        styles.margin = values.includes(',')
          ? values.split(',').map(v => v + 'px').join(' ')
          : values + 'px';
      }
      // Flexbox
      else if (part === 'flex') {
        styles.display = 'flex';
      }
      else if (part === 'col') {
        styles.flexDirection = 'column';
      }
      else if (part === 'center') {
        styles.alignItems = 'center';
        styles.justifyContent = 'center';
      }
      // Gap: gap10
      else if (part.match(/^gap\d/)) {
        styles.gap = part.substring(3) + 'px';
      }
    }

    return styles;
  }

  parseChildren(parentIndent) {
    const children = [];

    while (this.pos < this.lines.length) {
      const line = this.lines[this.pos];
      const indent = this.getIndent(this.pos);

      // End of children - line with same or less indent than parent
      if (indent <= parentIndent && line.trim()) {
        break;
      }

      const trimmed = line.trim();

      // Skip empty or comments
      if (!trimmed || trimmed.startsWith('#')) {
        this.pos++;
        continue;
      }

      // Text content
      if (trimmed.startsWith('"')) {
        children.push({
          type: 'Text',
          value: trimmed.slice(1, -1)
        });
        this.pos++;
        continue;
      }

      // Variable or Loop
      if (trimmed.startsWith('$') && !trimmed.includes('[')) {
        // Check if next line has more indent (children) - if so, it's a loop
        const nextLineIndent = this.pos + 1 < this.lines.length ?
          this.getIndent(this.pos + 1) : 0;
        const hasChildren = nextLineIndent > indent && this.lines[this.pos + 1].trim();

        if (hasChildren) {
          // It's a loop
          children.push(this.parseLoop(indent));
        } else {
          // It's a variable reference
          children.push({
            type: 'Variable',
            name: trimmed
          });
          this.pos++;
        }
        continue;
      }

      // Conditional
      if (trimmed.startsWith('?')) {
        children.push(this.parseConditional(indent));
        continue;
      }

      // Nested element
      if (trimmed.match(/^[.#a-zA-Z]/)) {
        children.push(this.parseMarkup());
        continue;
      }

      this.pos++;
    }

    return children;
  }

  parseConditional(parentIndent) {
    const line = this.lines[this.pos].trim();
    const match = line.match(/^\?\s+(.+)/);

    if (match) {
      const condition = match[1];
      const condIndent = this.getIndent(this.pos);
      this.pos++;

      return {
        type: 'Conditional',
        condition,
        trueBranch: this.parseChildren(condIndent),
        falseBranch: []
      };
    }

    return null;
  }

  parseLoop(parentIndent) {
    const line = this.lines[this.pos].trim();
    // Match: $users
    const match = line.match(/^\$(\w+)/);

    if (match) {
      const arrayName = '$' + match[1];
      const loopIndent = this.getIndent(this.pos);
      this.pos++;

      return {
        type: 'Loop',
        array: arrayName,
        template: this.parseChildren(loopIndent)
      };
    }

    return null;
  }

  parsePropertyAccess(line) {
    // Parse :propertyName syntax
    const match = line.match(/^:(\w+)$/);
    if (match) {
      return {
        type: 'PropertyAccess',
        property: match[1]
      };
    }
    return null;
  }

  getIndent(lineIndex) {
    const line = this.lines[lineIndex];
    return line.length - line.trimStart().length;
  }
}

export function parseComponent(source) {
  const parser = new Parser(source);
  return parser.parse();
}
