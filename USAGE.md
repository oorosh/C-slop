# C-slop Usage Guide

Quick guide to get started with C-slop.

## Installation

```bash
cd compiler
npm install
npm link
```

This installs the `cslop` command globally.

## Creating Your First App

Create `hello.slop`:

```cslop
*/ > #json({message: "Hello C-slop!", time: Date.now()})
```

Run it:

```bash
cslop hello.slop
```

Visit http://localhost:3000

## Complete CRUD Example

Create `api.slop`:

```cslop
// Simple CRUD API

// List all users
*/users > @users > #json

// Get user by ID
*/users/:id > @users[$.id] > #json

// Create user
*/users + @users!$.body > #json

// Update user
*/users/:id ~ @users[$.id]!$.body > #json

// Delete user
*/users/:id - @users[$.id]!- > #204
```

Run it:

```bash
cslop api.slop
```

Test it:

```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com"}'

# Get all users
curl http://localhost:3000/users

# Get specific user
curl http://localhost:3000/users/1
```

## Using Node Modules

C-slop works with any Node.js module!

Create `advanced.slop`:

```cslop
import axios from "axios"
import {format} from "date-fns"

*/ > #json({
  message: "Hello from C-slop",
  date: format(Date.now(), "yyyy-MM-dd HH:mm:ss")
})

*/github > axios.get("https://api.github.com") > #json

*/users > @users > #json
```

Install dependencies:

```bash
npm install axios date-fns
```

Run it:

```bash
cslop advanced.slop
```

## Syntax Overview

### Routes

```cslop
*/ > handler              # GET /
*/users > handler          # GET /users
*/users/:id > handler      # GET /users/:id
*/users + handler          # POST /users
*/users/:id ~ handler      # PUT /users/:id
*/users/:id - handler      # DELETE /users/:id
```

### Database Operations

```cslop
@users                     # Get all users
@users[123]                # Get user by ID
@users[$.id]               # Get user by request param
@users?{active:true}       # Filter users
@users!{name:"Alice"}      # Insert user
@users!$.body              # Insert from request body
@users[123]!{name:"Bob"}   # Update user
@users[123]!-              # Delete user
```

### Request Data

```cslop
$.body                     # Request body
$.params                   # URL params
$.id                       # Shorthand for $.params.id
$.query                    # Query string
$.headers                  # Headers
```

### Responses

```cslop
#json                      # Send as JSON
#json(data)                # Send specific data as JSON
#html(content)             # Send HTML
#201                       # Send status code
#404("Not found")          # Status with message
```

### Pipeline Operator

```cslop
a > b > c                  # Pipeline data through functions

@users > #json             # Get users, send as JSON
@users[$.id] > #json       # Get user by ID, send as JSON
axios.get(url) > #json     # Fetch and send as JSON
```

## Commands

### Run a .slop file

```bash
cslop app.slop
# or
cslop run app.slop
```

### Compile to JavaScript

```bash
cslop build app.slop -o app.js
```

This generates a JavaScript file you can run with Node.js:

```bash
node app.js
```

## Environment Variables

```bash
PORT=8080 cslop app.slop
```

## Examples

Check out the `compiler/test/` directory for more examples:

- `simple.slop` - Basic API
- `with-imports.slop` - Using Node modules
- `full-example.slop` - Complete application

## Tips

1. **Keep it simple** - C-slop is designed for minimal code
2. **Use Node modules** - Import anything from npm
3. **Pipeline everything** - Use `>` to chain operations
4. **Database is in-memory** - Data resets on restart (for now)
5. **Hot reload** - Restart when you change files

## Current Limitations (MVP)

- In-memory database only (persistent storage coming soon)
- Basic pipeline operator (advanced operators coming)
- No template rendering yet
- Simple error handling

## Next Steps

- Read the [Language Specification](./C-SLOP.md)
- Browse [Examples](./compiler/test/)
- Check the [Documentation](https://c-slop.dev)

## Getting Help

- File issues at: https://github.com/c-slop/c-slop/issues
- Read docs at: https://c-slop.dev
