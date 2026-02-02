/**
 * C-slop Frontend Parser
 * Parses .ui files into AST
 */

export class Parser {
  constructor(source) {
    this.source = source;
    this.lines = source.split('\n');
    this.pos = 0;
    this.aliases = {};  // Class aliases: &name = .class.combo
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

        if (!line || line.startsWith('//')) {
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

        // Parse alias definitions: &name = .class.combo
        if (line.startsWith('&')) {
          this.parseAlias(line);
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

        if (!line || line.startsWith('//')) {
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

        // Parse alias definitions: &name = .class.combo
        if (line.startsWith('&') && line.includes('=')) {
          this.parseAlias(line);
          this.pos++;
          continue;
        }

        // Markup (starts with element, class, &alias, or @@Component) - parse all root elements
        if (line.match(/^[.#@&a-zA-Z]/)) {
          this.ast.markup = this.parseRootElements();
          break;
        }

        this.pos++;
      }
    }

    return this.ast;
  }

  parseAlias(line) {
    // Parse: &name = .class.combo or &name = tag.class.combo
    const match = line.match(/^&(\w+)\s*=\s*(.+)$/);
    if (match) {
      this.aliases[match[1]] = match[2].trim();
    }
  }

  parseRootElements() {
    const elements = [];

    while (this.pos < this.lines.length) {
      const line = this.lines[this.pos].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('//')) {
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

      // Alias usage at root level: &name or &name[content]
      if (line.match(/^&\w/) && this.getIndent(this.pos) === 0) {
        elements.push(this.parseMarkup());
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

    // Parse element definition: tag.class#id, tag.class#id[content], or &alias[content]
    // Find the content bracket - it's a [ that's NOT preceded by - (which would be arbitrary value like p-[15px])
    const bracketIndex = this.findContentBracket(line);
    let elementDef = bracketIndex >= 0 ? line.substring(0, bracketIndex) : line;

    // Expand alias if starts with &
    if (elementDef.startsWith('&')) {
      const aliasName = elementDef.slice(1);
      if (this.aliases[aliasName]) {
        elementDef = this.aliases[aliasName];
      }
    }

    const element = this.parseElementDef(elementDef);

    // If has bracket, parse inline content (including multi-line code blocks)
    if (bracketIndex >= 0) {
      const contentStart = bracketIndex + 1;
      const content = line.substring(contentStart, line.lastIndexOf(']'));

      // Check for multi-line code block: [```...```]
      if (content.startsWith('```')) {
        element.children = this.parseMultilineBlock(contentStart);
      } else {
        element.children = this.parseInlineContent(content);
      }
    }

    // Parse children on next lines
    this.pos++;
    const childElements = this.parseChildren(parentIndent);
    element.children.push(...childElements);

    return element;
  }

  findContentBracket(line) {
    // Find the content bracket [, which is NOT part of an arbitrary value class like p-[15px]
    // Arbitrary value brackets are preceded by '-', content brackets are not
    let depth = 0;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '[') {
        // Check if this is an arbitrary value bracket (preceded by -)
        if (i > 0 && line[i - 1] === '-') {
          // This is an arbitrary value bracket, skip to its closing ]
          depth++;
        } else if (depth === 0) {
          // This is the content bracket
          return i;
        }
      } else if (char === ']') {
        if (depth > 0) {
          depth--;
        }
      }
    }
    return -1; // No content bracket found
  }

  parseMultilineBlock(startPos) {
    // Handle multi-line code blocks: [```\nline1\nline2\n```]
    const children = [];
    const currentLine = this.lines[this.pos];
    const bracketContent = currentLine.substring(startPos);

    // Check if it's all on one line: [```code```]
    if (bracketContent.includes('```') && bracketContent.lastIndexOf('```') > 3) {
      const start = bracketContent.indexOf('```') + 3;
      const end = bracketContent.lastIndexOf('```');
      const code = bracketContent.substring(start, end);
      // Split by newlines or treat as single line
      const lines = code.split('\\n');
      for (const line of lines) {
        if (line.trim()) {
          children.push({ type: 'Text', value: line, block: true });
        }
      }
      return children;
    }

    // Multi-line block spans multiple source lines
    // Find the closing ```]
    let codeLines = [];
    let pos = this.pos;
    let inBlock = true;

    // First line after [```
    const firstLineContent = bracketContent.substring(3).trim();
    if (firstLineContent && !firstLineContent.startsWith('```')) {
      codeLines.push(firstLineContent);
    }

    pos++;
    while (pos < this.lines.length && inBlock) {
      const line = this.lines[pos];
      if (line.includes('```]') || line.trim() === '```') {
        // End of block
        const beforeEnd = line.substring(0, line.indexOf('```')).trim();
        if (beforeEnd) {
          codeLines.push(beforeEnd);
        }
        inBlock = false;
        this.pos = pos; // Update position to after the block
      } else {
        // Regular code line - preserve content but trim common indent
        codeLines.push(line.trim());
        pos++;
      }
    }

    // Create text nodes for each line (will render as <p> or <span> elements)
    for (const codeLine of codeLines) {
      children.push({ type: 'CodeLine', value: codeLine });
    }

    return children;
  }

  parseElementDef(def) {
    let tag = 'div';
    let classes = [];
    let id = null;

    // Parse element definition, handling brackets in class names (e.g., p-[15px], bg-[#435453])
    // We need to be careful not to split on . or # inside brackets
    let i = 0;
    let current = '';
    let inBracket = false;
    let mode = 'tag'; // 'tag', 'class', or 'id'

    while (i < def.length) {
      const char = def[i];

      if (char === '[') {
        inBracket = true;
        current += char;
      } else if (char === ']') {
        inBracket = false;
        current += char;
      } else if (!inBracket && (char === '.' || char === '#')) {
        // Save current token
        if (current) {
          if (mode === 'tag') {
            tag = current;
          } else if (mode === 'class') {
            classes.push(current);
          } else if (mode === 'id') {
            id = current;
          }
        }
        // Set new mode
        mode = char === '.' ? 'class' : 'id';
        current = '';
      } else {
        current += char;
      }
      i++;
    }

    // Save final token
    if (current) {
      if (mode === 'tag') {
        tag = current;
      } else if (mode === 'class') {
        classes.push(current);
      } else if (mode === 'id') {
        id = current;
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

      // Handle quoted strings - these may contain interpolations and escaped quotes
      if (content[i] === '"') {
        const start = i + 1;
        i++;
        let text = '';
        while (i < content.length) {
          // Handle escaped quote \"
          if (content[i] === '\\' && i + 1 < content.length && content[i + 1] === '"') {
            text += '"';
            i += 2;
            continue;
          }
          // End of string
          if (content[i] === '"') break;
          text += content[i];
          i++;
        }
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

      // Handle events: @eventName(action), @nav(/path), or @ action (shorthand for click)
      if (content[i] === '@') {
        // Try named event: @eventName(action)
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

        // Try shorthand click event: @ action (everything after @ is the action)
        const shorthandMatch = content.substring(i).match(/^@\s+(.+)$/);
        if (shorthandMatch) {
          children.push({
            type: 'Event',
            eventName: 'click',
            action: shorthandMatch[1].trim()
          });
          i = content.length; // Consume rest of content
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
    // Match @{...} (reactive interpolation) only
    // Static {$var} is no longer supported to avoid conflicts with literal braces
    const regex = /@\{[^}]+\}/g;
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

      // Parse reactive interpolation: @{$name} or @{expr}
      const interpolation = match[0];
      const expr = interpolation.slice(2, -1).trim();
      children.push({
        type: 'ReactiveInterpolation',
        expression: expr
      });

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
      if (!trimmed || trimmed.startsWith('//')) {
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

      // Alias usage: &name or &name[content]
      if (trimmed.match(/^&\w/)) {
        children.push(this.parseMarkup());
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
