---
sidebar_position: 9
---

# Playground

Try C-slop in your browser! Experiment with the syntax and see the compiled JavaScript output.

:::info Coming Soon
The interactive playground is currently in development. In the meantime, you can install C-slop locally to experiment.
:::

## Installation

```bash
npm install -g cslop
```

## Quick Start

Create a file `hello.slop`:

```cslop
*/ > #html(~<h1>Hello C-slop!</h1>)
```

Run it:

```bash
cslop run hello.slop
```

Visit `http://localhost:3000` to see your app!

## Try These Examples

### Example 1: Simple API

```cslop
// Configure database
@:sqlite("./dev.db")

// Routes
*/users > @users > #json
*/users/:id > @users[$.id] > #json
*/users + @users!$.body > #201
```

### Example 2: Todo API

```cslop
@:sqlite("./todos.db")

*/todos > @todos > #json
*/todos/:id > @todos[$.id] > #json
*/todos + @todos!{...$.body, done:false, ts:now} > #201
*/todos/:id ~ @todos[$.id]!$.body > #json
*/todos/:id - @todos[$.id]!- > #204
```

### Example 3: Auth

```cslop
@:sqlite("./auth.db")

*/register + {
  $.body.email ?? #400("email required")
  $.body.pass ?? #400("password required")
  @users?{email:$.body.email}[0] ? #400("exists") : _
  user: @users!{email:$.body.email, pass:hash($.body.pass)}
  {token: jwt(user)} > #json
}

*/login + {
  u: @users?{email:$.body.email}[0]
  u ?? #401
  u.pass == hash($.body.pass) ? {token:jwt(u)} : #401
  > #json
}

*/profile > {
  jwt?($.headers.auth) ?? #401
  @users[_.id] > #json
}
```

### Example 4: Template Rendering

```cslop
*/ > {
  users: @users
  ~<html>
    <head>
      <title>Users</title>
    </head>
    <body>
      <h1>User List</h1>
      <ul>
        {users >> ~<li>{_.name} - {_.email}</li>}
      </ul>
    </body>
  </html>
} > #html
```

### Example 5: Complex Pipeline

```cslop
*/analytics > {
  jwt?($.headers.auth) ?? #401

  // Fetch data
  orders: @orders?{createdAt>now-86400}

  // Transform
  stats: {
    total: orders >+ _.amount : 0,
    count: orders.count,
    avg: (orders >+ _.amount : 0) / orders.count,
    byUser: orders
      .group(userId)
      >> {
          userId: _.userId,
          total: _ >+ _.amount : 0
        }
  }

  stats > #json
}
```

## REPL Mode

Start an interactive REPL:

```bash
cslop repl
```

Try commands:

```
> @users
> @users?{active:true}
> @users!{name:"Alice", email:"alice@x.com"}
> */test > #json({hello:"world"})
```

## CLI Commands

```bash
# Run a file
cslop run app.slop

# Watch mode (auto-reload)
cslop dev app.slop

# Compile to JavaScript
cslop build app.slop -o app.js

# Type check
cslop check app.slop

# Format code
cslop fmt app.slop

# Run tests
cslop test

# Create new project
cslop init my-app

# Start REPL
cslop repl
```

## Editor Support

### VS Code

Install the C-slop extension:

```bash
code --install-extension cslop.cslop-vscode
```

Features:
- Syntax highlighting
- Auto-completion
- Type hints
- Format on save
- Error checking

### Vim

```vim
Plug 'c-slop/vim-cslop'
```

### Emacs

```elisp
(use-package cslop-mode)
```

## Online Playground (Coming Soon)

Features in development:
- Live code editor with syntax highlighting
- Instant compilation to JavaScript
- Interactive output console
- Share code snippets
- Example library
- Database simulation
- API testing

## Debugging

Enable debug output:

```bash
DEBUG=cslop:* cslop run app.slop
```

### Add Logging

```cslop
*/users > {
  log("Fetching users")
  users: @users
  log("Found", users.count, "users")
  users > #json
}
```

### Inspect Values

```cslop
*/debug > {
  data: @users
  inspect(data)  // Pretty-print to console
  data > #json
}
```

## Performance Testing

```bash
# Benchmark routes
cslop bench app.slop

# Load test
cslop load app.slop --requests 10000 --concurrent 100
```

## Next Steps

- Review [Examples](/docs/examples) for real applications
- Check [Routing](/docs/routing) for advanced patterns
- Learn [Database](/docs/database) operations
- Read [Syntax Reference](/docs/syntax) for complete details

## Get Help

- [GitHub Issues](https://github.com/bigboggy/C-slop/issues)
- [Discord Community](https://discord.gg/c-slop)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/cslop)

## Contributing

Want to contribute? Check out:
- [Contributing Guide](https://github.com/bigboggy/C-slop/blob/main/CONTRIBUTING.md)
- [Good First Issues](https://github.com/bigboggy/C-slop/labels/good-first-issue)
