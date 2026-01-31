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
  button["+" @click($count++)]
  button["-" @click($count--)]
```

### State

```
$count:0                    # Signal with initial value
$name:""                    # String state
$items:[]                   # Array state
$doubled := $count * 2      # Computed (reactive)
```

### Effects

```
~ fetch("/api/data") > $data              # Fetch and store
~ fetch("/api") > $data > $loading:false  # Chain assignments
```

### Events

```
@click($count++)            # Increment state
@click($count--)            # Decrement state
@click($count:0)            # Reset state
@click(handleSave)          # Call function
@input($value:e.target.value)  # Input binding
@submit(handleSubmit)       # Form submit
@mouseenter(showTooltip)    # Any DOM event
```

### Attributes

```
src{$imageUrl}              # Dynamic attribute (from state)
alt{"Static text"}          # Static attribute (quoted string)
href{$link}                 # Dynamic href
class{$activeClass}         # Dynamic class
disabled{$isDisabled}       # Dynamic boolean
```

### Markup

```
div.container               # Element with class
h1["Title"]                 # Element with text
p["Count: @{$count}"]       # Reactive interpolation
@@Counter                   # Component (auto-imports)
? $loading                  # Conditional
  p["Loading..."]
$items                      # Loop over array
  .card
    span[:name]             # Access item.name
```

## Routing (router.slop)

```
# Syntax: /path > @@Component
/ > @@Home
/about > @@About
/users/:id > @@UserDetail
```

### Navigation

```
# @nav sets href and click handler automatically
a["Link" @nav(/path)]
button["Go" @nav(/path)]
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
    "light": {
      "primary": "#3b82f6",
      "success": "#22c55e"
    },
    "dark": {
      "primary": "#60a5fa",
      "success": "#4ade80"
    }
  }
}
```

Database types: `memory`, `sqlite`

## SlopUI (CSS Library)

SlopUI is a built-in CSS library similar to DaisyUI. It's included automatically in new projects.

### Theme Support

Dark/light mode with automatic persistence:

```
button["Toggle Theme" @click(toggleTheme)]
```

### Components

```
# Buttons
button.btn.btn-primary["Primary"]
button.btn.btn-secondary["Secondary"]
button.btn.btn-success["Success"]
button.btn.btn-ghost["Ghost"]
button.btn.btn-outline["Outline"]

# Cards
.card
  h3.card-title["Title"]
  .card-body
    p["Content"]

# Inputs
input.input["Placeholder"]
textarea.textarea["Message"]
select.select

# Alerts
.alert.alert-info["Info message"]
.alert.alert-success["Success!"]
.alert.alert-error["Error!"]

# Badges
span.badge.badge-primary["New"]
span.badge.badge-success["Active"]
```

### Layout Utilities

```
# Flexbox
.flex .flex-col .items-center .justify-center .justify-between
.gap-2 .gap-4 .gap-6

# Spacing
.p-4 .px-4 .py-4 .m-4 .mt-4 .mx-auto

# Text
.text-center .text-primary .text-secondary .text-sm .font-bold

# Containers
.container .container-sm .container-md
```

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
├── runtime/
│   ├── signals.js    # Reactive signals (~1.5KB)
│   ├── dom.js        # DOM helpers (~1KB)
│   └── router.js     # Client-side router
└── slopui/
    ├── base.css      # CSS reset & utilities
    ├── components.css # Component styles
    └── theme.js      # Theme generator
```

## Development

```bash
npm test              # Run tests
cslop test/example.slop  # Test with example
```
