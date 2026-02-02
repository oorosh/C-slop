/**
 * C-slop Frontend Code Generator
 * Generates JavaScript and CSS from AST
 */

// Regex to detect arbitrary value classes like p-[15px], bg-[#435453], etc.
const ARBITRARY_CLASS_REGEX = /^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|min-w|max-w|min-h|max-h|gap|text|bg|border|rounded|top|right|bottom|left|z|opacity)-\[(.+)\]$/;

// Mapping from arbitrary class prefix to CSS property/properties
const ARBITRARY_PROPERTY_MAP = {
  'p': ['padding'],
  'px': ['padding-left', 'padding-right'],
  'py': ['padding-top', 'padding-bottom'],
  'pt': ['padding-top'],
  'pb': ['padding-bottom'],
  'pl': ['padding-left'],
  'pr': ['padding-right'],
  'm': ['margin'],
  'mx': ['margin-left', 'margin-right'],
  'my': ['margin-top', 'margin-bottom'],
  'mt': ['margin-top'],
  'mb': ['margin-bottom'],
  'ml': ['margin-left'],
  'mr': ['margin-right'],
  'w': ['width'],
  'h': ['height'],
  'min-w': ['min-width'],
  'max-w': ['max-width'],
  'min-h': ['min-height'],
  'max-h': ['max-height'],
  'gap': ['gap'],
  'bg': ['background-color'],
  'rounded': ['border-radius'],
  'top': ['top'],
  'right': ['right'],
  'bottom': ['bottom'],
  'left': ['left'],
  'z': ['z-index'],
  'opacity': ['opacity'],
};

/**
 * Check if a value looks like a color (for text-[*] and border-[*] disambiguation)
 */
function isColorValue(value) {
  return value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl');
}

/**
 * Check if a class is an arbitrary value class
 */
function isArbitraryClass(className) {
  return ARBITRARY_CLASS_REGEX.test(className);
}

/**
 * Parse an arbitrary class and return its prefix and value
 */
function parseArbitraryClass(className) {
  const match = className.match(ARBITRARY_CLASS_REGEX);
  if (!match) return null;
  const [, prefix, value] = match;
  return { prefix, value, className };
}

/**
 * Generate CSS properties and value for an arbitrary class
 */
function getArbitraryProperties(prefix, value) {
  // Handle special cases that depend on the value
  if (prefix === 'text') {
    return isColorValue(value) ? ['color'] : ['font-size'];
  }
  if (prefix === 'border') {
    return isColorValue(value) ? ['border-color'] : ['border-width'];
  }
  return ARBITRARY_PROPERTY_MAP[prefix] || [];
}

/**
 * Escape special characters for CSS selector
 */
function escapeForCSS(className) {
  return className.replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/#/g, '\\#');
}

/**
 * Generate CSS rule for an arbitrary class
 */
function generateArbitraryClassCSS(className) {
  const parsed = parseArbitraryClass(className);
  if (!parsed) return null;

  const { prefix, value } = parsed;
  const properties = getArbitraryProperties(prefix, value);

  if (properties.length === 0) return null;

  const escapedSelector = escapeForCSS(className);
  const declarations = properties.map(prop => `  ${prop}: ${value};`).join('\n');

  return `.${escapedSelector} {\n${declarations}\n}`;
}

// SlopUI utility classes that should NOT be scoped
const UTILITY_CLASS_PREFIXES = [
  // Buttons
  'btn',
  // Cards
  'card',
  // Inputs
  'input', 'textarea', 'select', 'checkbox', 'radio', 'toggle',
  // Alerts & Badges
  'alert', 'badge',
  // Layout
  'container', 'flex', 'grid', 'items-', 'justify-', 'gap-', 'col-', 'row-',
  // Spacing
  'p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-',
  'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-',
  // Text
  'text-', 'font-', 'leading-', 'tracking-',
  // Sizing
  'w-', 'h-', 'min-', 'max-',
  // Display
  'hidden', 'block', 'inline', 'relative', 'absolute', 'fixed', 'sticky',
  // Tables
  'table',
  // Navigation
  'navbar', 'nav-', 'breadcrumb',
  // Tabs
  'tabs', 'tab-',
  // Modal
  'modal',
  // Progress
  'progress',
  // Tooltip
  'tooltip',
  // Dropdown
  'dropdown',
  // Avatar
  'avatar',
  // Overflow
  'overflow-',
];

function isUtilityClass(className) {
  // First check if it's an arbitrary value class
  if (isArbitraryClass(className)) return true;
  // Then check predefined prefixes
  return UTILITY_CLASS_PREFIXES.some(prefix => className.startsWith(prefix));
}

export class CodeGenerator {
  constructor(ast, componentName) {
    this.ast = ast;
    this.componentName = componentName;
    this.scopeId = this.generateScopeId(componentName);
  }

  generateScopeId(name) {
    // Simple hash for scoped class names
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).slice(0, 4);
  }

  generate() {
    const js = this.generateJS();
    const css = this.generateCSS();
    return { js, css };
  }

  generateJS() {
    const parts = [];

    // Imports
    parts.push(`import { signal, computed, effect } from './signals.js';`);
    parts.push(`import { h, list, mount, navigate } from './dom.js';`);

    // Component imports
    if (this.ast.imports && this.ast.imports.length > 0) {
      this.ast.imports.forEach(imp => {
        parts.push(`import { ${imp.name} } from '${imp.path}';`);
      });
    }
    parts.push('');

    // Component function
    parts.push(`export function ${this.componentName}() {`);

    // State
    if (this.ast.state.length > 0) {
      parts.push('  // State');
      this.ast.state.forEach(state => {
        if (state.computed) {
          parts.push(`  const $${state.name} = computed(() => ${state.initial});`);
        } else {
          parts.push(`  const $${state.name} = signal(${state.initial});`);
        }
      });
      parts.push('');
    }

    // Effects
    if (this.ast.effects.length > 0) {
      parts.push('  // Effects');
      this.ast.effects.forEach(eff => {
        const action = this.compileAction(eff.action);

        // For fetch chains, run once on mount
        if (eff.action.includes('fetch')) {
          parts.push(`  effect(() => {`);
          parts.push(`    ${action};`);
          parts.push(`  });`);
        } else if (eff.deps.length > 0) {
          const deps = eff.deps.map(d => this.compileCondition(d)).join(' && ');
          parts.push(`  effect(() => {`);
          parts.push(`    if (${deps}) {`);
          parts.push(`      ${action};`);
          parts.push(`    }`);
          parts.push(`  });`);
        } else {
          parts.push(`  effect(() => { ${action}; });`);
        }
      });
      parts.push('');
    }

    // Render function
    parts.push('  // Render');
    parts.push('  const render = () => {');
    if (this.ast.markup && this.ast.markup.length > 0) {
      if (this.ast.markup.length === 1) {
        // Single root element
        const rendered = this.generateElement(this.ast.markup[0], '    ');
        parts.push(`    return ${rendered};`);
      } else {
        // Multiple root elements - return as array (fragment)
        const elements = this.ast.markup.map(el => this.generateElement(el, '      ')).join(',\n      ');
        parts.push(`    return [\n      ${elements}\n    ];`);
      }
    } else {
      parts.push('    return h("div", null, "Empty component");');
    }
    parts.push('  };');
    parts.push('');
    parts.push('  return render;');
    parts.push('}');

    return parts.join('\n');
  }

  compileAction(action) {
    // Handle fetch chains: fetch /url > $var
    if (action.includes('fetch')) {
      return this.compileFetchChain(action);
    }

    // Handle variable assignments: $var:value
    if (action.includes(':')) {
      const match = action.match(/\$(\w+)\s*:\s*(.+)/);
      if (match) {
        return `$${match[1]}.value = ${match[2]};`;
      }
    }

    // Handle increment/decrement: $count++, $count--
    if (action.includes('++')) {
      const varName = action.replace('++', '').trim();
      return `${varName}.value++;`;
    }
    if (action.includes('--')) {
      const varName = action.replace('--', '').trim();
      return `${varName}.value--;`;
    }

    // Handle generic API actions
    // Syntax: method:/path {body} > $array + action
    // Examples:
    //   post:/api/users {name:$name} > $users + clear
    //   delete:/api/users/:id > $users - :id
    const apiMatch = action.match(/^(get|post|put|delete):([^\s{]+)\s*(\{[^}]*\})?\s*>\s*(\$\w+)\s*([+-])\s*(.+)?$/i);
    if (apiMatch) {
      const [, method, path, bodyStr, arrayVar, operator, modifier] = apiMatch;
      return this.compileApiAction(method.toUpperCase(), path, bodyStr, arrayVar, operator, modifier);
    }

    // Handle simple function calls: functionName -> functionName()
    // If it's a simple identifier (no operators, no parens), add () to call it
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(action.trim())) {
      return `${action.trim()}()`;
    }

    return action;
  }

  compileFetchChain(action) {
    // fetch /url > $var > $loading:false
    const parts = action.split('>').map(p => p.trim());
    let code = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part.startsWith('fetch')) {
        const url = part.replace('fetch', '').trim();
        code = `fetch(${url}).then(r => r.json())`;
      } else if (part.startsWith('$') && part.includes(':')) {
        const match = part.match(/\$(\w+)\s*:\s*(.+)/);
        if (match) {
          code += `.then(() => { $${match[1]}.value = ${match[2]}; })`;
        }
      } else if (part.startsWith('$')) {
        code += `.then(data => { ${part}.value = data; })`;
      }
    }

    return code;
  }

  compileCondition(condition) {
    // Replace $var with $var.value in conditions
    return condition.replace(/\$(\w+)/g, '$$$1.value');
  }

  compileApiAction(method, path, bodyStr, arrayVar, operator, modifier) {
    // Build the URL - replace :param with item.param for loops
    let url = path.includes(':')
      ? `\`${path.replace(/:(\w+)/g, '${item.$1}')}\``
      : `'${path}'`;

    // Build fetch options
    let fetchOptions = `{ method: '${method}'`;

    if (bodyStr && method !== 'GET' && method !== 'DELETE') {
      // Parse body: {name:$name,email:$email} -> { name: $name.value, email: $email.value }
      const bodyContent = bodyStr
        .replace(/\$(\w+)/g, '$$$1.value')
        .replace(/(\w+):/g, '"$1":');
      fetchOptions += `, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(${bodyContent})`;
    }
    fetchOptions += ' }';

    // Build the response handler
    let responseHandler = '';

    if (operator === '+') {
      // Add to array
      if (modifier && modifier.startsWith('clear')) {
        // Clear form inputs after adding - extract vars from body
        const varsToMatch = bodyStr ? bodyStr.match(/\$\w+/g) : [];
        const clearStatements = varsToMatch
          ? varsToMatch.map(v => `${v}.value = '';`).join(' ')
          : '';
        responseHandler = `.then(r => r.json()).then(data => { ${arrayVar}.value = [...${arrayVar}.value, data]; ${clearStatements} })`;
      } else {
        responseHandler = `.then(r => r.json()).then(data => { ${arrayVar}.value = [...${arrayVar}.value, data]; })`;
      }
    } else if (operator === '-') {
      // Remove from array by property
      const prop = modifier ? modifier.replace(':', '') : 'id'; // :id -> id, default to id
      responseHandler = `.then(() => { ${arrayVar}.value = ${arrayVar}.value.filter(x => x.${prop} !== item.${prop}); })`;
    }

    return `fetch(${url}, ${fetchOptions})${responseHandler}`;
  }

  generateElement(element, indent = '', inLoop = false) {
    if (element.type === 'Text') {
      // Escape quotes and backslashes for JavaScript string output
      const escaped = element.value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      return `"${escaped}"`;
    }

    if (element.type === 'CodeLine') {
      // Code line from multi-line block - render as <p> with the text
      const escaped = element.value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      return `h("p", null, "${escaped}")`;
    }

    if (element.type === 'Variable') {
      return `${element.name}.value`;
    }

    if (element.type === 'StaticInterpolation') {
      // Static interpolation: {$var} - just get .value once
      const expr = element.expression.replace(/\$(\w+)/g, '$$$1.value');
      return expr;
    }

    if (element.type === 'ReactiveInterpolation') {
      // Reactive interpolation: @{$var} - create reactive text node
      // Return the signal object itself, will be handled in h() function
      return element.expression;
    }

    if (element.type === 'PropertyAccess') {
      return inLoop ? `item.${element.property}` : `"${element.property}"`;
    }

    if (element.type === 'Conditional') {
      const trueBranch = element.trueBranch.map(child =>
        this.generateElement(child, indent, inLoop)
      ).join(', ');
      const condition = this.compileCondition(element.condition);
      return `${condition} ? [${trueBranch}] : []`;
    }

    if (element.type === 'Loop') {
      const template = element.template.map(child =>
        this.generateElement(child, indent, true)
      ).join(', ');
      return `list(${element.array}, (item, index) => { item.index = index; return [${template}]; })`;
    }

    if (element.type === 'Component') {
      // Render child component: ComponentName()() returns the DOM element(s)
      const componentName = element.tag;
      return `${componentName}()()`;
    }

    if (element.type === 'Element') {
      const tag = element.tag;
      const props = this.generateProps(element, inLoop);
      const children = this.generateChildren(element.children, indent + '  ', inLoop, tag);

      return `h("${tag}", ${props}, ${children})`;
    }

    return 'null';
  }

  generateProps(element, inLoop = false) {
    const props = {};
    const events = {};

    // Classes - preserve utility classes, scope component-specific classes
    if (element.classes.length > 0) {
      const processedClasses = element.classes.map(c =>
        isUtilityClass(c) ? c : `${c}-${this.scopeId}`
      );
      props.class = processedClasses.join(' ');
    }

    // ID
    if (element.id) {
      props.id = element.id;
    }

    // For input elements, check for variable binding and placeholder
    if (element.tag === 'input') {
      const varChild = element.children.find(c => c.type === 'Variable');
      const textChild = element.children.find(c => c.type === 'Text');

      if (varChild) {
        // Two-way binding - pass signal object for subscription
        const varName = varChild.name;
        props.value = varName; // Pass signal object, not .value
        events.input = `(e) => { ${varName}.value = e.target.value; }`;
      }

      if (textChild) {
        // Placeholder text
        props.placeholder = textChild.value;
      }
    }

    // Extract HTML attributes from children
    const attributeChildren = element.children.filter(c => c.type === 'Attribute');
    attributeChildren.forEach(attr => {
      if (attr.dynamic) {
        // Dynamic attribute - will be handled specially in prop generation
        props[attr.name] = { dynamic: true, value: attr.value };
      } else {
        props[attr.name] = attr.value;
      }
    });

    // Extract navigation from children - sets both href and onclick
    const navChildren = element.children.filter(c => c.type === 'Nav');
    navChildren.forEach(nav => {
      props.href = nav.path;
      events.click = `e.preventDefault(); navigate('${nav.path}')`;
      events.needsEvent = true;
    });

    // Extract event handlers from children
    const eventChildren = element.children.filter(c => c.type === 'Event');
    eventChildren.forEach(event => {
      const action = this.compileAction(event.action);
      const eventName = event.eventName || 'click';
      events[eventName] = action;
    });

    // Build props object
    const propParts = [];

    if (Object.keys(props).length > 0) {
      Object.entries(props).forEach(([key, value]) => {
        if (key === 'value' && typeof value === 'string' && value.startsWith('$')) {
          // Signal binding - pass as is
          propParts.push(`${key}: ${value}`);
        } else if (key === 'value') {
          propParts.push(`${key}: ${value}`);
        } else if (typeof value === 'object' && value.dynamic) {
          // Dynamic attribute - compile the expression
          const expr = value.value.replace(/\$(\w+)/g, '$$$1.value');
          propParts.push(`${key}: ${expr}`);
        } else if (key === 'placeholder' || key === 'type') {
          const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          propParts.push(`${key}: "${escaped}"`);
        } else {
          const escaped = typeof value === 'string' ? value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : value;
          propParts.push(`${key}: "${escaped}"`);
        }
      });
    }

    if (Object.keys(events).length > 0) {
      const needsEvent = events.needsEvent;
      Object.entries(events).forEach(([key, value]) => {
        if (key === 'needsEvent') return;  // Skip the flag
        const handlerName = `on${key}`;
        if (key === 'input') {
          propParts.push(`oninput: ${value}`);
        } else if (needsEvent && key === 'click') {
          propParts.push(`onclick: (e) => { ${value} }`);
        } else {
          propParts.push(`${handlerName}: () => { ${value} }`);
        }
      });
    }

    if (propParts.length === 0) {
      return 'null';
    }

    return `{ ${propParts.join(', ')} }`;
  }

  generateChildren(children, indent, inLoop = false, elementTag = null) {
    // Filter out Event, Nav, and Attribute nodes as they're handled in props
    // Filter out Variable and Text nodes for input elements (they're used for binding/placeholder)
    let nonEventChildren = children.filter(c => c.type !== 'Event' && c.type !== 'Attribute' && c.type !== 'Nav');

    if (elementTag === 'input') {
      nonEventChildren = nonEventChildren.filter(c => c.type !== 'Variable' && c.type !== 'Text');
    }

    if (nonEventChildren.length === 0) {
      return 'null';
    }

    if (nonEventChildren.length === 1) {
      return this.generateElement(nonEventChildren[0], indent, inLoop);
    }

    const childrenCode = nonEventChildren
      .map(child => this.generateElement(child, indent, inLoop))
      .join(', ');

    return `[${childrenCode}]`;
  }

  generateCSS() {
    const parts = [];
    const arbitraryClasses = new Set();

    parts.push(`/* Generated from ${this.componentName}.ui */`);
    parts.push('');

    // Generate scoped styles for all root elements
    if (this.ast.markup && this.ast.markup.length > 0) {
      this.ast.markup.forEach(element => {
        this.collectArbitraryClasses(element, arbitraryClasses);
        this.collectStyles(element, parts);
      });
    }

    // Generate CSS for arbitrary classes
    if (arbitraryClasses.size > 0) {
      parts.push('/* Arbitrary value utilities */');
      arbitraryClasses.forEach(className => {
        const css = generateArbitraryClassCSS(className);
        if (css) {
          parts.push(css);
          parts.push('');
        }
      });
    }

    return parts.join('\n');
  }

  collectArbitraryClasses(element, arbitraryClasses) {
    if (!element) return;

    if (element.type === 'Element') {
      // Collect arbitrary classes from this element
      if (element.classes && element.classes.length > 0) {
        element.classes.forEach(className => {
          if (isArbitraryClass(className)) {
            arbitraryClasses.add(className);
          }
        });
      }

      // Recurse into children
      if (element.children) {
        element.children.forEach(child => {
          this.collectArbitraryClasses(child, arbitraryClasses);
        });
      }
    } else if (element.type === 'Conditional') {
      if (element.trueBranch) {
        element.trueBranch.forEach(el => this.collectArbitraryClasses(el, arbitraryClasses));
      }
      if (element.falseBranch) {
        element.falseBranch.forEach(el => this.collectArbitraryClasses(el, arbitraryClasses));
      }
    } else if (element.type === 'Loop') {
      if (element.template) {
        element.template.forEach(el => this.collectArbitraryClasses(el, arbitraryClasses));
      }
    }
  }

  collectStyles(element, parts) {
    if (!element || element.type !== 'Element') return;

    // Generate class if element has classes (skip utility classes - they come from SlopUI)
    if (element.classes.length > 0) {
      element.classes.forEach(className => {
        // Skip utility classes (including arbitrary classes) - they're provided by SlopUI or generated separately
        if (isUtilityClass(className)) return;

        const scopedClass = `${className}-${this.scopeId}`;
        parts.push(`.${scopedClass} {`);

        // Add styles (simplified for now)
        if (Object.keys(element.styles).length > 0) {
          Object.entries(element.styles).forEach(([key, value]) => {
            parts.push(`  ${key}: ${value};`);
          });
        }

        parts.push('}');
        parts.push('');
      });
    }

    // Recurse children
    element.children.forEach(child => {
      if (child.type === 'Element') {
        this.collectStyles(child, parts);
      } else if (child.type === 'Conditional') {
        child.trueBranch.forEach(el => this.collectStyles(el, parts));
        child.falseBranch.forEach(el => this.collectStyles(el, parts));
      }
    });
  }
}

export function generateCode(ast, componentName) {
  const generator = new CodeGenerator(ast, componentName);
  return generator.generate();
}
