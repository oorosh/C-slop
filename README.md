# C-slop

A token-minimal programming language for web applications. Write web apps in 80% fewer tokens.

## What is C-slop?

C-slop is designed for **machine efficiency** - minimizing tokens while maintaining expressiveness for common web operations: routing, database CRUD, rendering, and input processing.

### Example

```cslop
// Complete REST API in a few lines
*/ > #json({message: "Hello C-slop!"})

*/users > @users > #json

*/users/:id > @users[$.id] > #json

*/users + @users!$.body > #json
```

Equivalent Express.js would be 10x more tokens.

## Installation

```bash
cd compiler
npm install
npm link
```

## Quick Start

Create a file `app.slop`:

```cslop
import axios from "axios"

*/ > #json({message: "Hello World", time: Date.now()})

*/users > @users > #json

*/users + @users!$.body > #json

*/api/data > axios.get("https://api.example.com") > #json
```

Run it:

```bash
cslop app.slop
```

Visit `http://localhost:3000`

## Features

- ✅ **Routes** with `*` symbol
- ✅ **Database** with `@` symbol
- ✅ **Request** with `$` symbol
- ✅ **Response** with `#` symbol
- ✅ **Pipeline** with `>` operator
- ✅ **Import Node modules** (axios, date-fns, etc.)
- ✅ **HTTP methods** (GET, POST, PUT, DELETE)

## Documentation

- [Language Specification](./C-SLOP.md) - Complete syntax reference
- [Compiler Documentation](./compiler/README.md) - Implementation details
- [Online Docs](https://c-slop.dev) - Full documentation website

## Repository Structure

```
/
├── C-SLOP.md           # Language specification
├── CLAUDE.md           # Developer guidance
├── compiler/           # Working compiler & runtime
│   ├── src/           # Compiler source code
│   └── test/          # Example .slop files
└── docs/              # Documentation website (Docusaurus)
```

## Examples

See [`compiler/test/`](./compiler/test/) for complete examples:

- `simple.slop` - Basic API
- `with-imports.slop` - Using Node modules
- `full-example.slop` - Complete application

## Compiler

The compiler transpiles `.slop` to JavaScript and provides a runtime with Express.js.

```bash
# Run a .slop file
cslop app.slop

# Compile to JavaScript
cslop build app.slop -o app.js
```

## Current Status

**MVP**: Basic functionality working
- ✅ Route definitions
- ✅ Database operations (in-memory)
- ✅ Request/Response handling
- ✅ Pipeline operators
- ✅ Node module imports
- ⏳ Persistent databases (coming soon)
- ⏳ Advanced operators (>>, >?, >+)
- ⏳ Template rendering (~)
- ⏳ Error handling (>|)

## Contributing

This is an experimental language. Contributions welcome!

## License

MIT
