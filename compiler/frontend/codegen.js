/**
 * C-slop Frontend Code Generator
 * Generates JavaScript and CSS from AST
 */

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
      return `"${element.value}"`;
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

    // Classes
    if (element.classes.length > 0) {
      const scopedClasses = element.classes.map(c => `${c}-${this.scopeId}`);
      props.class = scopedClasses.join(' ');
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
          propParts.push(`${key}: "${value}"`);
        } else {
          propParts.push(`${key}: "${value}"`);
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

    parts.push(`/* Generated from ${this.componentName}.ui */`);
    parts.push('');

    // Generate scoped styles for all root elements
    if (this.ast.markup && this.ast.markup.length > 0) {
      this.ast.markup.forEach(element => {
        this.collectStyles(element, parts);
      });
    }

    return parts.join('\n');
  }

  collectStyles(element, parts) {
    if (!element || element.type !== 'Element') return;

    // Generate class if element has classes
    if (element.classes.length > 0) {
      element.classes.forEach(className => {
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
