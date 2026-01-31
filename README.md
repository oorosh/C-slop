# C-slop

A token-minimal programming language for full-stack web applications. Write web apps in 80% fewer tokens.

## What is C-slop?

C-slop is designed for **machine efficiency** - minimizing tokens while maintaining expressiveness. It provides:

- **Backend**: Express.js API routes with database operations
- **Frontend**: Reactive UI components with signals
- **Routing**: Client-side SPA navigation

## Quick Start

```bash
# Install
cd compiler && npm install && npm link

# Create a new project
cslop create my-app
cd my-app

# Start dev server with hot reload
cslop watch
```

Visit `http://localhost:3000`

## Project Structure

```
my-app/
├── slop.json          # Configuration
├── api.slop           # Backend API routes
├── router.slop        # Frontend routing
├── components/        # UI components
│   ├── Home.ui
│   └── Counter.ui
└── dist/              # Compiled output
```

## Backend (.slop files)

```cslop
# REST API in a few lines
*/ > #json({message: "Hello!"})

*/users > @users > #json

*/users/:id > @users[$.id] > #json

*/users + @users!$.body > #json

*/users/:id - @users[$.id]!- > #204
```

### Symbols

| Symbol | Meaning | Example |
|--------|---------|---------|
| `*` | Route | `*/api/users` |
| `+` | POST | `*/users +` |
| `^` | PUT | `*/users/:id ^` |
| `-` | DELETE | `*/users/:id -` |
| `@` | Database | `@users` |
| `$` | Request | `$.body`, `$.id` |
| `#` | Response | `#json`, `#201` |
| `>` | Pipeline | `@users > #json` |

## Frontend (.ui files)

```
# Counter.ui - Reactive component
$count:0

<?

.counter
  h1["Count: @{$count}"]
  button["+" @ $count++]
  button["-" @ $count--]
```

### Features

- **State**: `$count:0` - Reactive signals
- **Computed**: `$doubled := $count * 2`
- **Effects**: `~ fetch("/api") > $data`
- **Interpolation**: `@{$var}` - Reactive text
- **Events**: `@ $count++` - Click handlers
- **Components**: `@@Counter` - Auto-imports

## Routing (router.slop)

```
# Client-side SPA routing
/ > @@Home
/counter > @@Counter
/users/:id > @@UserDetail
```

### Navigation

```
# In components
a["Go to Counter" href="/counter" @ nav /counter]
button["Back" @ nav /]
```

## Commands

```bash
cslop create <name>    # Create new project
cslop watch            # Dev server + hot reload
cslop start            # Production server
cslop <file.slop>      # Run a .slop file
cslop build <file>     # Compile to JS
```

## Documentation

- [Language Specification](./C-SLOP.md)
- [Frontend Status](./compiler/FRONTEND-STATUS.md)
- [Database Guide](./DATABASE-GUIDE.md)
- [Online Docs](https://c-slop.dev)

## Features

### Backend
- Routes with HTTP methods
- In-memory & SQLite databases
- Request/Response handling
- Pipeline operators
- Node module imports

### Frontend
- Reactive signals (~1.5KB)
- Component system
- Client-side routing
- Hot reload development
- Scoped CSS

## License

MIT
