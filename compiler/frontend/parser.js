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
      imports: [],  // Component imports
      state: [],
      effects: [],
      markup: [],  // Now an array of root elements
      actions: {}
    };
  }

  parse() {
    // Check if source uses <? separator
    const separatorIndex = this.lines.findIndex(line => line.trim() === '<?');

    if (separatorIndex !== -1) {
      // Parse state/effects before <?
      while (this.pos < separatorIndex) {
        const line = this.lines[this.pos].trim();

        if (!line || line.startsWith('#')) {
          this.pos++;
          continue;
        }

        if (line.startsWith('$')) {
          this.parseState(line);
          this.pos++;
          continue;
        }

        if (line.startsWith('~')) {
          this.parseEffect(line);
          this.pos++;
          continue;
        }

        this.pos++;
      }

      // Skip the <? line
      this.pos = separatorIndex + 1;

      // Parse all markup after <?
      this.ast.markup = this.parseRootElements();
    } else {
      // Legacy mode: no separator, parse as before
      while (this.pos < this.lines.length) {
        const line = this.lines[this.pos].trim();

        if (!line || line.startsWith('#')) {
          this.pos++;
          continue;
        }

        if (line.startsWith('$')) {
          this.parseState(line);
          this.pos++;
          continue;
        }

        if (line.startsWith('~')) {
          this.parseEffect(line);
          this.pos++;
          continue;
        }

        // Markup (starts with element, class, or @@Component) - parse all root elements
        if (line.match(/^[.#@a-zA-Z]/)) {
          this.ast.markup = this.parseRootElements();
          break;
        }

        this.pos++;
      }
    }

    return this.ast;
  }

  parseRootElements() {
    const elements = [];

    while (this.pos < this.lines.length) {
      const line = this.lines[this.pos].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        this.pos++;
        continue;
      }

      // Component reference: @@ComponentName
      if (line.match(/^@@[A-Z]/) && this.getIndent(this.pos) === 0) {
        const componentName = line.slice(2); // Remove @@
        elements.push({
          type: 'Component',
          tag: componentName,
          children: []
        });
        this.ast.imports.push({
          name: componentName,
          path: `./${componentName}.js`
        });
        this.pos++;
        continue;
      }

      // Root element (no indent, starts with element/class)
      if (line.match(/^[.#a-zA-Z]/) && this.getIndent(this.pos) === 0) {
        elements.push(this.parseMarkup());
        continue;
      }

      // If we hit something else at root level, stop
      if (this.getIndent(this.pos) === 0) {
        break;
      }

      this.pos++;
    }

    return elements;
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
    // Parse content piece by piece, handling quoted strings specially
    let i = 0;

    while (i < content.length) {
      // Skip whitespace
      while (i < content.length && /\s/.test(content[i])) i++;
      if (i >= content.length) break;

      // Handle quoted strings - these may contain interpolations
      if (content[i] === '"') {
        const start = i + 1;
        i++;
        while (i < content.length && content[i] !== '"') i++;
        const text = content.substring(start, i);
        i++; // Skip closing quote

        // Parse interpolations inside the quoted string
        children.push(...this.parseTextWithInterpolations(text));
        continue;
      }

      // Handle variable references: $name
      if (content[i] === '$') {
        const match = content.substring(i).match(/^\$\w+/);
        if (match) {
          children.push({
            type: 'Variable',
            name: match[0]
          });
          i += match[0].length;
          continue;
        }
      }

      // Handle property access: :name
      if (content[i] === ':') {
        const match = content.substring(i).match(/^:\w+/);
        if (match) {
          children.push({
            type: 'PropertyAccess',
            property: match[0].substring(1)
          });
          i += match[0].length;
          continue;
        }
      }

      // Handle attributes: name{"value"} for static, name{$var} for dynamic
      if (content[i].match(/[a-zA-Z]/) && content.substring(i).match(/^([a-zA-Z][a-zA-Z0-9-]*)\{/)) {
        const attrMatch = content.substring(i).match(/^([a-zA-Z][a-zA-Z0-9-]*)\{([^}]*)\}/);
        if (attrMatch) {
          const name = attrMatch[1];
          const value = attrMatch[2].trim();
          // Check if it's a quoted string or a variable
          const isStatic = value.startsWith('"') && value.endsWith('"');
          children.push({
            type: 'Attribute',
            name: name,
            value: isStatic ? value.slice(1, -1) : value,
            dynamic: !isStatic
          });
          i += attrMatch[0].length;
          continue;
        }
      }

      // Handle events: @eventName(action) or @nav(/path)
      if (content[i] === '@') {
        const eventMatch = content.substring(i).match(/^@([a-zA-Z]+)\(([^)]*)\)/);
        if (eventMatch) {
          const eventName = eventMatch[1];
          const eventValue = eventMatch[2].trim();

          if (eventName === 'nav') {
            children.push({
              type: 'Nav',
              path: eventValue
            });
          } else {
            children.push({
              type: 'Event',
              eventName: eventName,
              action: eventValue
            });
          }
          i += eventMatch[0].length;
          continue;
        }
      }

      // If we got here, move forward
      i++;
    }

    return children;
  }

  parseTextWithInterpolations(text) {
    const children = [];
    // Match @{...} (reactive) and {...} (static) interpolations
    const regex = /(@\{[^}]+\}|\{[^}]+\})/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before interpolation
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          children.push({
            type: 'Text',
            value: beforeText
          });
        }
      }

      // Parse interpolation
      const interpolation = match[0];
      if (interpolation.startsWith('@{')) {
        // Reactive interpolation: @{$name}
        const expr = interpolation.slice(2, -1).trim();
        children.push({
          type: 'ReactiveInterpolation',
          expression: expr
        });
      } else {
        // Static interpolation: {$name}
        const expr = interpolation.slice(1, -1).trim();
        children.push({
          type: 'StaticInterpolation',
          expression: expr
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        children.push({
          type: 'Text',
          value: remainingText
        });
      }
    }

    // If no interpolations found, return plain text
    if (children.length === 0) {
      children.push({
        type: 'Text',
        value: text
      });
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

      // Component reference: @@ComponentName
      if (trimmed.match(/^@@[A-Z]/)) {
        const componentName = trimmed.slice(2); // Remove @@
        children.push({
          type: 'Component',
          tag: componentName,
          children: []
        });
        // Auto-import if not already imported
        if (!this.ast.imports.find(i => i.name === componentName)) {
          this.ast.imports.push({
            name: componentName,
            path: `./${componentName}.js`
          });
        }
        this.pos++;
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
