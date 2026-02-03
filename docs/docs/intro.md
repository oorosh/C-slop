---
sidebar_position: 1
---

# Getting Started

Welcome to **C-slop** - a token-minimal full-stack framework for web applications.

## What is C-slop?

C-slop provides:

- **Backend**: Express.js API routes with database operations
- **Frontend**: Reactive UI components with signals
- **Routing**: Client-side SPA navigation
- **SlopUI**: Built-in CSS component library with dark/light themes

## Quick Start

```bash
# Install globally
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
    ├── index.html
    ├── js/
    └── css/
```

## Backend (.slop files)

```
// REST API routes
*/api/health > #json({status: "ok"})

*/api/users > @users > #json

*/api/users/:id > @users[$.id] > #json

*/api/users + @users!$.body > #json

*/api/users/:id - @users[$.id]!- > #204
```

### Backend Symbols

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
// Counter.ui - Reactive component
$count:0

<?

.container.text-center.py-8
  h1["Count: @{$count}"]
  .flex.gap-2.justify-center
    button.btn.btn-secondary["-" @click($count--)]
    button.btn.btn-primary["+" @click($count++)]
```

### Frontend Features

- **State**: `$count:0` - Reactive signals
- **Computed**: `$doubled := $count * 2` - Derived values
- **Effects**: `~ fetch("/api") > $data` - Side effects
- **Events**: `@click($count++)`, `@nav(/path)`
- **Attributes**: `src{$url}`, `alt{"text"}`
- **ID Alias**: `&` is used instead of `#` for element IDs (e.g., `div&main` instead of `div#main`)

## Routing (router.slop)

```
// Client-side SPA routing
/ > @@Home
/counter > @@Counter
/users/:id > @@UserDetail
```

### Navigation

```
a["Go to Counter" @nav(/counter)]
button["Back" @nav(/)]
```

## SlopUI

Built-in CSS library with dark/light theme support:

```
button.btn.btn-primary["Primary"]
button.btn.btn-secondary["Secondary"]
.card
  h3.card-title["Title"]
  p["Content"]
.alert.alert-success["Success!"]
```

Toggle theme:
```
button["Toggle Theme" @click(toggleTheme)]
```

## Commands

```bash
cslop create <name>    # Create new project
cslop watch            # Dev server + hot reload
cslop start            # Production server
cslop <file.slop>      # Run a .slop file
cslop build <file>     # Compile to JS
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
  },
  "theme": {
    "light": { "primary": "#3b82f6" },
    "dark": { "primary": "#60a5fa" }
  }
}
```

## Next Steps

- Learn [Frontend Components](/docs/components) for UI development
- Explore [SlopUI](/docs/slopui) for styling
- Check [Routing](/docs/client-routing) for navigation
- Browse [Examples](/docs/examples) for complete apps
