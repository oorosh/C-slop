# C-slop Compiler & Runtime

A working implementation of the C-slop language - a token-minimal programming language for web applications.

## Installation

```bash
cd compiler
npm install
npm link  # Install globally
```

## Usage

### Run a .slop file

```bash
cslop test.slop
# or
cslop run test.slop
```

### Compile to JavaScript

```bash
cslop build test.slop -o output.js
```

## Example

Create a file `hello.slop`:

```cslop
// Simple API
*/ > #json({message: "Hello World"})

*/users > @users > #json

*/users/:id > @users[$.id] > #json

*/users + @users!$.body > #json
```

Run it:

```bash
cslop hello.slop
```

Visit `http://localhost:3000` to see your API!

## Features

### Supported Syntax

- ✅ Routes with `*` symbol
- ✅ Database operations with `@` symbol
- ✅ Request data with `$` symbol
- ✅ Response with `#` symbol
- ✅ Pipeline operator `>`
- ✅ Import Node modules
- ✅ HTTP methods (GET, POST, PUT, DELETE)
- ✅ In-memory database (for testing)

### Import Node Modules

```cslop
import axios from "axios"
import {format} from "date-fns"

*/api/data > axios.get("https://api.example.com") > #json

*/date > #json({date: format(Date.now(), "yyyy-MM-dd")})
```

### Database Operations

```cslop
// Get all
@users > #json

// Get by ID
@users[$.id] > #json

// Filter
@users?{active:true} > #json

// Insert
@users!$.body > #json
```

### Request Parameters

```cslop
// URL params: /users/:id
$.id

// Query params: /search?q=test
$.query.q

// Body: POST /users
$.body

// Headers
$.headers.authorization
```

### Response Types

```cslop
// JSON
#json(data)

// HTML
#html(content)

// Status codes
#201
#404
#500

// Status with message
#400("Bad request")
```

## Limitations (MVP)

This is an MVP implementation with the following limitations:

1. **In-memory database** - No persistent storage yet
2. **Limited operators** - Basic pipeline only
3. **No middleware yet** - Coming soon
4. **No complex queries** - Basic DB operations only
5. **Simple parser** - May not handle all edge cases

## Roadmap

- [ ] Persistent database support (SQLite, PostgreSQL)
- [ ] Full pipeline operators (>>, >?, >+, >!)
- [ ] Middleware support
- [ ] Template rendering (~)
- [ ] Error handling (>|)
- [ ] More built-in functions
- [ ] Better parser with AST
- [ ] Type checking
- [ ] REPL mode

## Development

```bash
# Test the compiler
node test/test.js

# Test with example file
cslop test/example.slop
```
