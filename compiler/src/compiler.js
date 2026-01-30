/**
 * C-slop Compiler
 * Compiles .slop code to JavaScript
 */

class Compiler {
  constructor(code, options = {}) {
    this.code = code;
    this.options = options;
    this.lines = code.split('\n');
    this.output = [];
    this.routes = [];
    this.imports = [];
    this.variables = {};
  }

  compile() {
    // Add runtime setup
    this.output.push('// Compiled from C-slop');
    this.output.push('const { app, db, request, response, utils } = runtime;');
    this.output.push('');

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('//')) continue;

      // Handle imports
      if (line.startsWith('import ')) {
        this.compileImport(line);
        continue;
      }

      // Handle route definitions
      if (line.startsWith('*')) {
        this.compileRoute(line, i);
        continue;
      }

      // Handle database configuration
      if (line.startsWith('@:')) {
        this.compileDbConfig(line);
        continue;
      }

      // Handle variable assignments and other statements
      this.compileLine(line);
    }

    // Start server at the end
    this.output.push('');
    this.output.push('// Start server');
    this.output.push('const PORT = process.env.PORT || 3000;');
    this.output.push('app.listen(PORT, () => {');
    this.output.push('  console.log(`Server running at http://localhost:${PORT}`);');
    this.output.push('});');

    return this.output.join('\n');
  }

  compileImport(line) {
    // import {format} from "date-fns"
    // import axios from "axios"
    const match = line.match(/import\s+(.+?)\s+from\s+["'](.+?)["']/);
    if (match) {
      const [, importPart, moduleName] = match;
      this.output.push(`const ${importPart} = require('${moduleName}');`);
      this.imports.push({ importPart, moduleName });
    }
  }

  compileRoute(line, lineIndex) {
    // Parse route: */path/:param > handler > #json
    // Route format: METHOD/path OPERATION body

    let method = 'get';
    let routeLine = line;

    // Check for HTTP method prefix
    if (routeLine.includes(' + ')) method = 'post';
    else if (routeLine.includes(' ~ ')) method = 'put';
    else if (routeLine.includes(' - ')) method = 'delete';

    // Extract route path
    const routeMatch = routeLine.match(/^\*([^\s+~-]+)/);
    if (!routeMatch) return;

    const routePath = routeMatch[1];

    // Get the handler part (everything after the path and operator)
    const operatorPos = routeLine.search(/[\+~-]|(?<!\*)>/);
    let handler = operatorPos > 0 ? routeLine.substring(operatorPos + 1).trim() : routeLine.substring(routePath.length + 1).trim();

    // Remove leading '>' if present
    if (handler.startsWith('>')) {
      handler = handler.substring(1).trim();
    }

    // Generate route handler
    this.output.push('');
    this.output.push(`// Route: ${method.toUpperCase()} ${routePath}`);
    this.output.push(`app.${method}('${routePath}', async (req, res) => {`);
    this.output.push('  try {');
    this.output.push('    const $ = request(req);');

    // Compile the handler pipeline
    const compiledHandler = this.compileHandler(handler);
    this.output.push(`    ${compiledHandler}`);

    this.output.push('  } catch (error) {');
    this.output.push('    console.error("Route error:", error);');
    this.output.push('    res.status(500).json({ error: error.message });');
    this.output.push('  }');
    this.output.push('});');
  }

  compileHandler(handler) {
    // Handle pipeline operations: a > b > c
    const parts = handler.split('>').map(p => p.trim()).filter(p => p);

    let output = [];
    let currentVar = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Handle response operations (#json, #html, #404, etc.)
      if (part.startsWith('#')) {
        output.push(this.compileResponse(part, currentVar));
        return output.join('\n    ');
      }

      // Handle database operations (@users, @users[$.id], etc.)
      if (part.startsWith('@')) {
        const dbOp = this.compileDbOperation(part);
        const varName = `data${i}`;
        output.push(`const ${varName} = await ${dbOp};`);
        currentVar = varName;
        continue;
      }

      // Handle code blocks
      if (part.startsWith('{')) {
        const block = this.extractBlock(handler, handler.indexOf('{'));
        output.push(this.compileBlock(block));
        break;
      }

      // Handle function calls or expressions
      const compiled = this.compileExpression(part, currentVar);
      const varName = `result${i}`;

      // Check if it's an expression that needs await
      // Await database ops, axios calls, fetch calls, and anything with await
      const needsAwait = compiled.includes('await') ||
                        part.startsWith('@') ||
                        part.includes('axios.') ||
                        part.includes('fetch(');

      if (needsAwait) {
        output.push(`const ${varName} = await ${compiled};`);
      } else {
        output.push(`const ${varName} = ${compiled};`);
      }
      currentVar = varName;
    }

    // If we reach here and have a currentVar, return it as JSON
    if (currentVar) {
      output.push(`res.json(${currentVar});`);
    }

    return output.join('\n    ');
  }

  compileResponse(responsePart, dataVar = 'result') {
    // #json, #json(data), #html, #404, #201, etc.

    // Status codes
    if (/^#\d+$/.test(responsePart)) {
      const status = responsePart.substring(1);
      return `res.status(${status}).send();`;
    }

    // Status with message
    const statusMatch = responsePart.match(/^#(\d+)\((.+)\)$/);
    if (statusMatch) {
      const [, status, message] = statusMatch;
      return `res.status(${status}).json({ error: ${message} });`;
    }

    // Response methods
    if (responsePart === '#json') {
      return `res.json(${dataVar});`;
    }

    const jsonMatch = responsePart.match(/^#json\((.+)\)$/s);
    if (jsonMatch) {
      let expr = jsonMatch[1];
      // Only compile if it doesn't look like already valid JavaScript
      if (!expr.startsWith('{') && !expr.startsWith('[')) {
        expr = this.compileExpression(expr);
      }
      return `res.json(${expr});`;
    }

    if (responsePart === '#html') {
      return `res.send(${dataVar});`;
    }

    const htmlMatch = responsePart.match(/^#html\((.+)\)$/s);
    if (htmlMatch) {
      let expr = htmlMatch[1];
      if (!expr.startsWith('~')) {
        expr = this.compileExpression(expr);
      }
      return `res.send(${expr});`;
    }

    return `res.json(${dataVar});`;
  }

  compileDbOperation(dbOp) {
    // @users -> db.users.findAll()
    // @users[123] -> db.users.findById(123)
    // @users[$.id] -> db.users.findById($.id)
    // @users?{active:true} -> db.users.findWhere({active:true})
    // @users! -> db.users.insert()
    // @users!{name:"x"} -> db.users.insert({name:"x"})
    // @users[123]!- -> db.users.delete(123)

    // Delete: @users[123]!-
    const deleteMatch = dbOp.match(/^@(\w+)\[([^\]]+)\]!-$/);
    if (deleteMatch) {
      const [, table, id] = deleteMatch;
      const compiledId = this.compileExpression(id);
      return `db.${table}.delete(${compiledId})`;
    }

    // Update: @users[123]!{data}
    const updateMatch = dbOp.match(/^@(\w+)\[([^\]]+)\]!(.+)$/);
    if (updateMatch) {
      const [, table, id, data] = updateMatch;
      const compiledId = this.compileExpression(id);
      const compiledData = this.compileExpression(data);
      return `db.${table}.update(${compiledId}, ${compiledData})`;
    }

    // Simple table reference
    if (/^@\w+$/.test(dbOp)) {
      const table = dbOp.substring(1);
      return `db.${table}.findAll()`;
    }

    // Get by ID: @users[123] or @users[$.id]
    const byIdMatch = dbOp.match(/^@(\w+)\[([^\]]+)\]$/);
    if (byIdMatch) {
      const [, table, id] = byIdMatch;
      const compiledId = this.compileExpression(id);
      return `db.${table}.findById(${compiledId})`;
    }

    // Filter: @users?{active:true}
    const filterMatch = dbOp.match(/^@(\w+)\?(.+)$/);
    if (filterMatch) {
      const [, table, filter] = filterMatch;
      const compiledFilter = this.compileExpression(filter);
      return `db.${table}.findWhere(${compiledFilter})`;
    }

    // Insert: @users!{name:"x"}
    const insertMatch = dbOp.match(/^@(\w+)!(.+)$/);
    if (insertMatch) {
      const [, table, data] = insertMatch;
      const compiledData = this.compileExpression(data);
      return `db.${table}.insert(${compiledData})`;
    }

    return `db.${dbOp.substring(1)}.findAll()`;
  }

  compileExpression(expr, contextVar = null) {
    // Don't transform if it's already JavaScript
    if (!expr) return expr;

    // Replace $ with req parameters
    expr = expr.replace(/\$\.body/g, 'req.body');
    expr = expr.replace(/\$\.query/g, 'req.query');
    expr = expr.replace(/\$\.params/g, 'req.params');
    expr = expr.replace(/\$\.headers/g, 'req.headers');
    expr = expr.replace(/\$\.(\w+)/g, 'req.params.$1');

    // Replace utility functions (only if not already prefixed)
    expr = expr.replace(/\bnow\b/g, 'Date.now()');
    expr = expr.replace(/\buuid\b/g, 'utils.uuid()');
    expr = expr.replace(/\bhash\(/g, 'utils.hash(');

    // Handle env() function
    if (expr.includes('env(')) {
      expr = expr.replace(/env\(["']([^"']+)["']\)/g, 'process.env.$1');
      expr = expr.replace(/env\(([^)]+)\)/g, 'process.env[$1]');
    }

    return expr;
  }

  compileBlock(block) {
    // Handle code blocks {...}
    const lines = block.slice(1, -1).split('\n').map(l => l.trim()).filter(l => l);
    const compiled = lines.map(line => {
      if (line.includes(':')) {
        const [name, value] = line.split(':').map(s => s.trim());
        return `const ${name} = ${this.compileExpression(value)};`;
      }
      return this.compileExpression(line) + ';';
    });

    return compiled.join('\n    ');
  }

  compileDbConfig(line) {
    // @:postgres(env(DB_URL))
    // @:sqlite("./db.sqlite")
    const match = line.match(/@:(\w+)\((.+)\)/);
    if (match) {
      const [, dbType, config] = match;
      const compiledConfig = this.compileExpression(config);
      this.output.push(`// Database configuration: ${dbType}`);
      this.output.push(`db.connect('${dbType}', ${compiledConfig});`);
    }
  }

  compileLine(line) {
    // Handle general statements
    this.output.push(this.compileExpression(line) + ';');
  }

  extractBlock(text, startPos) {
    let depth = 0;
    let inString = false;
    let endPos = startPos;

    for (let i = startPos; i < text.length; i++) {
      const char = text[i];

      if (char === '"' || char === "'") inString = !inString;
      if (!inString) {
        if (char === '{') depth++;
        if (char === '}') {
          depth--;
          if (depth === 0) {
            endPos = i;
            break;
          }
        }
      }
    }

    return text.substring(startPos, endPos + 1);
  }
}

function compile(code, options = {}) {
  const compiler = new Compiler(code, options);
  return compiler.compile();
}

module.exports = { compile, Compiler };
