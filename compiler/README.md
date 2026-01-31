# C-slop Compiler & Runtime

Full-stack compiler for the C-slop language - compiles backend `.slop` files and frontend `.ui` components.

## Installation

```bash
cd compiler
npm install
npm link  # Install 'cslop' globally
```

## Commands

```bash
cslop create <name>      # Create new project with routing
cslop watch              # Dev server with hot reload
cslop start              # Production server
cslop <file.slop>        # Run a .slop file
cslop build <file> -o out.js  # Compile to JavaScript
```

## Project Scaffolding

```bash
cslop create my-app
cd my-app
cslop watch
```

Creates:
- `slop.json` - Configuration
- `api.slop` - Backend API
- `router.slop` - Client-side routing
- `components/Home.ui` - Home page
- `components/Counter.ui` - Example component
- `dist/` - Static files

## Backend (.slop files)

```cslop
# API Routes
*/api/health > #json({status: "ok"})

*/users > @users > #json

*/users/:id > @users[$.id] > #json

*/users + @users!$.body > #json

*/users/:id ^ @users[$.id]!$.body > #json

*/users/:id - @users[$.id]!- > #204
```

### Symbols

| Symbol | Meaning |
|--------|---------|
| `*` | Route definition |
| `+` | POST method |
| `^` | PUT method |
| `-` | DELETE method |
| `@` | Database table |
| `$` | Request data |
| `#` | Response |
| `>` | Pipeline |
| `?` | Filter |
| `!` | Mutation |

## Frontend (.ui files)

```
# Component with state
$count:0
$doubled := $count * 2

~ fetch("/api/data") > $items

<?

.counter
  h1["Count: @{$count}"]
  p["Doubled: @{$doubled}"]
  button["+" @ $count++]
  button["-" @ $count--]
```

### Features

- **State**: `$name:value` - Reactive signals
- **Computed**: `$derived := expression`
- **Effects**: `~ action` - Side effects
- **Markup**: Indentation-based, CSS selectors
- **Events**: `@ action` - Click handlers
- **Interpolation**: `@{$var}` - Reactive text
- **Components**: `@@Name` - Auto-imports
- **Loops**: `$items` + indented template
- **Conditionals**: `? $condition`

## Routing (router.slop)

```
# Syntax: /path > @@Component
/ > @@Home
/about > @@About
/users/:id > @@UserDetail
```

### Navigation

```
a["Link" href="/path" @ nav /path]
button["Go" @ nav /path]
```

## Configuration (slop.json)

```json
{
  "name": "my-app",
  "database": {
    "type": "memory"
  },
  "server": {
    "port": 3000,
    "static": "./dist"
  }
}
```

Database types: `memory`, `sqlite`

## Architecture

```
compiler/
├── src/
│   ├── cli.js        # CLI commands
│   ├── compiler.js   # Backend parser
│   └── runtime.js    # Express wrapper
├── frontend/
│   ├── parser.js     # .ui parser
│   ├── codegen.js    # JS generator
│   ├── router-parser.js    # router.slop parser
│   └── router-codegen.js   # Router generator
└── runtime/
    ├── signals.js    # Reactive signals (~1.5KB)
    ├── dom.js        # DOM helpers (~1KB)
    └── router.js     # Client-side router
```

## Development

```bash
npm test              # Run tests
cslop test/example.slop  # Test with example
```
