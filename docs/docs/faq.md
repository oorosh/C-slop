---
sidebar_position: 7
---

# FAQ & Troubleshooting

Common questions and solutions for C-slop development.

## General Questions

### What is C-slop?

C-slop is a token-minimal programming language designed for web applications. It reduces boilerplate by 75-82% compared to JavaScript, making it ideal for AI-assisted development and rapid prototyping.

### Why "C-slop"?

The name reflects its philosophy: minimal, efficient, and designed for machine consumption. The "C" stands for "concise" and the language embraces practicality over ceremony.

### Is C-slop production-ready?

C-slop is currently in active development. The language specification is stable, but the compiler and runtime are being refined. Use it for prototypes and experiments, but evaluate carefully for production use.

### What does C-slop compile to?

C-slop compiles to JavaScript (Node.js) as its primary target. WASM and direct bytecode compilation are planned for future releases.

### How does C-slop compare to TypeScript/JavaScript?

C-slop is designed for different goals:
- **Token efficiency**: 75-82% fewer tokens than JS
- **Symbol-based**: Uses `@`, `$`, `#`, `>` instead of keywords
- **Web-first**: Routes, database, HTML are built-in
- **Pipeline-oriented**: Data flows through `>` operators

TypeScript excels at type safety and large codebases. C-slop excels at rapid development and token minimization.

### Can I use C-slop with existing JavaScript libraries?

Yes! C-slop can import and use npm packages:

```cslop
import {format} from "date-fns"

^/date > format(now, "yyyy-MM-dd") > #json
```

## Installation Issues

### npm install fails

Ensure you have Node.js 20+ installed:

```bash
node --version  # Should be 20.0 or higher
npm install -g cslop
```

### Command not found: cslop

Add npm global bin to your PATH:

```bash
# Find npm global bin
npm bin -g

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$PATH:$(npm bin -g)"
```

## Syntax Questions

### Why use symbols instead of keywords?

Symbols reduce token count dramatically:
- `@users` vs `database.table('users')` - 1 token vs 7 tokens
- `^/api` vs `app.get('/api')` - 2 tokens vs 6 tokens
- `$.body` vs `request.body` - 2 tokens vs 3 tokens

This adds up quickly in real applications.

### How do I learn the symbols?

There are only 10 core symbols:
- `^` Route
- `@` Database
- `$` Request
- `#` Response
- `>` Pipe
- `?` Query
- `!` Mutate
- `~` Template
- `&` Parallel
- `_` Context

Practice with [examples](/docs/examples) and they become second nature.

### Where are semicolons?

C-slop uses newlines as statement terminators. Semicolons are optional:

```cslop
// Both valid
a: 1; b: 2; c: 3
a: 1
b: 2
c: 3
```

### How do I write comments?

```cslop
// Single-line comment

/* Multi-line
   comment */
```

## Database Issues

### Connection errors

Check your database URL:

```cslop
// Must be called before any queries
@:postgres(env(DB_URL))

// Verify environment variable
log(env(DB_URL))
```

### Table not found

Ensure tables exist in your database:

```bash
# Check tables
psql $DB_URL -c "\dt"

# Create table manually or use schema
@users: {
  id: int.pk.auto
  name: str
  email: str.unique
}
```

### Foreign key joins not working

C-slop automatically joins on foreign keys named `{table}Id`:

```cslop
// Works if posts table has userId column
@users.posts

// Explicit foreign key in schema
@posts: {
  userId: int.fk(@users)
}
```

## Routing Issues

### 404 for all routes

Check route definitions:

```cslop
// Must start with ^
^/users > @users > #json  // ✓ Correct

/users > @users > #json   // ✗ Wrong - missing ^
```

### Routes not matching

Order matters - more specific routes first:

```cslop
// Correct order
^/users/admin > handleAdmin
^/users/:id > handleUser

// Wrong order - :id catches everything
^/users/:id > handleUser
^/users/admin > handleAdmin  // Never reached
```

### POST body is empty

Ensure you're using `$.body`:

```cslop
^/users + {
  data: $.body  // Request body
  @users!data > #201
}
```

## Runtime Errors

### "Cannot read property" error

Check for null values:

```cslop
// May fail if user doesn't exist
^/users/:id > @users[$.id].name > #json

// Better - handle null
^/users/:id > @users[$.id] >| #404 > #json
```

### "Type error" in pipeline

Ensure data types match:

```cslop
// Wrong - trying to pipe number to array operation
5 >> _ * 2

// Right - array before map
[1,2,3] >> _ * 2
```

### Memory leaks

Close database connections and clear caches:

```cslop
// Use connection pooling
@:postgres(env(DB_URL), {pool:true})

// Clear caches periodically
@cache?{expires<now}!-
```

## Performance Issues

### Slow queries

Add indexes:

```cslop
@users.index(email)
@posts.index(userId, createdAt)
```

Select only needed fields:

```cslop
// Slow - returns all fields
@users

// Fast - only needed fields
@users[id, name, email]
```

### High memory usage

Use pagination:

```cslop
// Bad - loads all records
@users

// Good - paginate
@users[:100:page*100]
```

Stream large responses:

```cslop
^/export > #stream > @users >! #write(csv(_))
```

## Development Tips

### Hot reload not working

Use `dev` mode:

```bash
cslop dev app.slop  # Auto-reloads on changes
```

### Debugging techniques

Add logging:

```cslop
^/users > {
  log("Fetching users")
  users: @users
  log("Found:", users)
  users > #json
}
```

Use inspect:

```cslop
^/debug > {
  data: @users
  inspect(data)  // Pretty-print to console
  data > #json
}
```

### Testing strategies

Write simple tests:

```cslop
// test.slop
test("creates user", {
  user: {name:"Test", email:"test@x.com"}
  result: @users!user
  assert(result.id)
  assert(result.email == user.email)
})
```

## Language Features

### How do I do loops?

Use pipeline operators:

```cslop
// Map
[1,2,3] >> _ * 2

// Filter
[1,2,3,4] >? _ > 2

// Reduce
[1,2,3] >+ _ : 0

// Each
[1,2,3] >! log(_)
```

### How do I handle async?

Everything is async by default! No `async`/`await` needed:

```cslop
// Automatically awaited
^/users > @users > #json

// All these are awaited
^/data > fetch(url) > parse > @store! > #json
```

### Type annotations?

C-slop infers types. Optional type hints for documentation:

```cslop
fn add(a:int, b:int):int a+b

// But usually not needed
fn add(a,b) a+b
```

### Error handling patterns?

Use the `>|` operator:

```cslop
// Simple
@users[$.id] >| #404

// Multiple catches
operation >| {
  NotFound: #404
  Unauthorized: #401
  _: #500
}

// Early return
^/api + {
  $.body.email ?? #400("email required")
  // Continue if valid
}
```

## Common Patterns

### Authentication

```cslop
// Middleware
^/api/* > {
  jwt?($.headers.auth) ?? #401
  _  // Continue with user in context
}

// Use in routes
^/api/profile > @users[_.id] > #json
```

### Pagination

```cslop
paginate: (query, page, size) {
  items: query[:size:page*size]
  {items, total:query.count, page, size}
}

^/users > paginate(@users, $.query.page ?? 0, 20) > #json
```

### Validation

```cslop
validate: (data, rules) {
  rules >> {
    k: _
    r: rules[k]
    r.required && !data[k] ? throw("missing: " + k) : _
  }
  data
}

^/users + {
  validate($.body, {name:{required:true}, email:{required:true}})
  @users!$.body > #201
}
```

## Editor Support

### VS Code not highlighting syntax

Install the extension:

```bash
code --install-extension cslop.cslop-vscode
```

### Autocomplete not working

Ensure LSP server is running:

```bash
cslop lsp
```

Configure in VS Code settings:

```json
{
  "cslop.lsp.enable": true
}
```

## Getting Help

### Documentation

- [Getting Started](/docs/intro)
- [Syntax Reference](/docs/syntax)
- [Examples](/docs/examples)
- [Routing](/docs/routing)
- [Database](/docs/database)

### Community

- [GitHub Discussions](https://github.com/c-slop/c-slop/discussions)
- [Discord](https://discord.gg/c-slop)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/cslop)

### Bug Reports

File issues at: [github.com/c-slop/c-slop/issues](https://github.com/c-slop/c-slop/issues)

Include:
- C-slop version (`cslop --version`)
- Node.js version (`node --version`)
- Operating system
- Minimal reproduction code
- Error messages

## Contributing

Want to help improve C-slop?

- [Contributing Guide](https://github.com/c-slop/c-slop/blob/main/CONTRIBUTING.md)
- [Good First Issues](https://github.com/c-slop/c-slop/labels/good-first-issue)
- [Roadmap](https://github.com/c-slop/c-slop/blob/main/ROADMAP.md)

## Still Stuck?

If your question isn't answered here:

1. Check the [Syntax Reference](/docs/syntax) for complete language details
2. Browse [Examples](/docs/examples) for similar use cases
3. Search [GitHub Issues](https://github.com/c-slop/c-slop/issues)
4. Ask on [Discord](https://discord.gg/c-slop)
5. Open a [new issue](https://github.com/c-slop/c-slop/issues/new)
