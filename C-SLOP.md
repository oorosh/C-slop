# C-slop Language Specification

> A token-minimal programming language for web applications

## Philosophy

C-slop is designed for **machine efficiency** - minimizing tokens while maintaining expressiveness for common web operations: routing, database CRUD, rendering, and input processing. It uses symbols and implicit conventions to eliminate boilerplate.

---

## Core Principles

1. **Symbols over keywords** - Use `@`, `$`, `#`, `>` instead of words
2. **Implicit everything** - Types, returns, async - all inferred
3. **Pipeline-first** - Data flows through `>` operators
4. **Built-in web primitives** - Routes, DB, HTML are first-class
5. **Convention over configuration** - Sensible defaults everywhere

---

## Symbol Reference

| Symbol | Meaning | Example |
|--------|---------|---------|
| `@` | Database table | `@users` |
| `$` | Request/Input data | `$.id`, `$.body` |
| `#` | Response/Output | `#json`, `#html` |
| `>` | Pipe/Flow | `a > b > c` |
| `?` | Query/Filter | `@users?{age>18}` |
| `!` | Action/Mutation | `@users!{name:"x"}` |
| `~` | Template/Render | `~view` |
| `^` | Route definition | `^/path` |
| `&` | Parallel execution | `a & b` |
| `_` | Current context/item | `_.name` |

---

## Syntax

### Routes

```cslop
// GET route - fetch user by id
^/users/:id > @users[$.id] > #json

// POST route - create user
^/users + $.body > @users! > #201

// DELETE route
^/users/:id - @users[$.id]! > #204

// Route with logic
^/login + {
  u: @users?{email:$.email}[0]
  u.pass == $.pass ? #jwt(u) : #401
}
```

**Comparison (Express.js):**
```javascript
// 47 tokens
app.get('/users/:id', async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(user);
});

// C-slop: 8 tokens
^/users/:id > @users[$.id] > #json
```

### Database Operations

```cslop
// Select all
@users

// Select with filter
@users?{active:true, age>21}

// Select specific fields
@users[name,email]

// Get by id
@users[123]

// Insert
@users!{name:"John", email:"j@x.com"}

// Update
@users[123]!{name:"Jane"}

// Delete
@users[123]!-

// Join (implicit on foreign keys)
@users.posts

// Complex query
@users?{role:"admin"}[name,email]:10:0  // limit 10, offset 0
```

### Objects & Data

```cslop
// Object literal (keys without quotes)
{name:"John", age:30, active:true}

// Nested
{user:{name:"x"}, meta:{ts:now}}

// Array
[1,2,3]

// Access
obj.key
arr[0]

// Spread
{...obj, newKey:"val"}

// Destructure (implicit)
{a,b}: obj  // a=obj.a, b=obj.b
```

### Functions

```cslop
// Named function
fn add(a,b) a+b

// Arrow (implicit return)
add: (a,b) a+b

// Multi-line
validate: (user) {
  user.name ? user.email ? true : "no email" : "no name"
}

// Pipe functions
^/data > fetch > parse > validate > @store! > #json
```

### Conditionals

```cslop
// Ternary (primary form)
cond ? yes : no

// Multi-branch
x ?
  >10 : "big"
  >5  : "med"
  _   : "small"

// Guard clauses
^/admin > $.role=="admin" ? @data > #json : #403
```

### Loops & Transforms

```cslop
// Map (implicit)
@users >> _.name.upper

// Filter
@users >? _.age > 18

// Reduce
@users >+ _.balance : 0

// Each (side effects)
@users >! log(_)

// Chained
@users >? _.active >> {name:_.name, bal:_.balance} >+ _.bal : 0
```

### Templates / Rendering

```cslop
// Inline HTML
~<div>{user.name}</div>

// Template file
~views/user(user)

// Component
Box: ~<div class="box">{children}</div>

// List render
~<ul>{@users >> ~<li>{_.name}</li>}</ul>

// Conditional render
~<div>{user ? ~<span>{user.name}</span> : ~<span>Guest</span>}</div>
```

### Error Handling

```cslop
// Try-catch shorthand
dangerous >| fallback

// Chain with error
@users[$.id] >| #404

// Multiple catches
op >| {
  NotFound: #404
  AuthErr: #401
  _: #500
}
```

### Middleware & Hooks

```cslop
// Before all routes
^* > auth($) > _

// Before specific routes
^/admin/* > isAdmin($) ? _ : #403

// After (response transform)
^/api/* >># {data:_, ts:now}
```

---

## Built-in Functions

### Request (`$`)
- `$.params` / `$.id` - URL params
- `$.query` - Query string
- `$.body` - Request body
- `$.headers` - Headers
- `$.method` - HTTP method
- `$.cookies` - Cookies

### Response (`#`)
- `#json(data)` - JSON response
- `#html(content)` - HTML response
- `#text(str)` - Plain text
- `#file(path)` - File download
- `#redirect(url)` - Redirect
- `#status` - Status codes: `#200`, `#404`, `#500`
- `#cookie(k,v)` - Set cookie
- `#header(k,v)` - Set header

### Database (`@`)
- `@table` - Select all
- `@table[id]` - Select by id
- `@table?{...}` - Filter
- `@table!{...}` - Insert
- `@table[id]!{...}` - Update
- `@table[id]!-` - Delete
- `@table.relation` - Join
- `@raw(sql)` - Raw SQL

### Utilities
- `now` - Current timestamp
- `uuid` - Generate UUID
- `hash(s)` - Hash string
- `jwt(data)` / `jwt?(token)` - JWT encode/decode
- `env(key)` - Environment variable
- `log(x)` - Console log
- `sleep(ms)` - Delay
- `fetch(url)` - HTTP fetch

---

## Full Example: Todo API

```cslop
// Config
@:postgres(env(DB_URL))

// Middleware
^/api/* > jwt?($.headers.auth) ? {user:_} : #401

// Routes
^/api/todos       > @todos?{userId:$.user.id} > #json
^/api/todos/:id   > @todos[$.id] > #json
^/api/todos     + {...$.body, userId:$.user.id} > @todos! > #201
^/api/todos/:id ~ $.body > @todos[$.id]! > #json
^/api/todos/:id - @todos[$.id]!- > #204

// With validation
^/api/todos + {
  $.body.title ?? #400("title required")
  {...$.body, userId:$.user.id, ts:now} > @todos! > #201
}
```

**Equivalent Express.js: ~80 lines / ~400 tokens**
**C-slop: ~15 lines / ~60 tokens**

---

## File Structure

```
app/
  main.slop      # Entry point, routes
  models.slop    # DB schema hints (optional)
  views/         # Template files
    index.slop
    user.slop
  lib/           # Shared functions
    auth.slop
```

---

## Schema Definition (Optional)

```cslop
// models.slop
@users: {
  id: int.pk.auto
  name: str.required
  email: str.unique
  pass: str
  ts: time.default(now)
}

@posts: {
  id: int.pk.auto
  userId: int.fk(@users)
  title: str
  body: text
}
```

---

## Compilation Target

C-slop compiles to:
- **JavaScript/Node.js** (primary)
- **WASM** (planned)
- **Direct bytecode** (planned)

---

## Token Comparison Summary

| Task | JavaScript | C-slop | Savings |
|------|------------|--------|---------|
| GET route + DB query | ~45 tokens | ~8 tokens | 82% |
| POST with validation | ~60 tokens | ~15 tokens | 75% |
| Full CRUD API | ~200 tokens | ~40 tokens | 80% |
| List render | ~30 tokens | ~10 tokens | 67% |

---

## Next Steps

1. **Parser** - PEG.js or tree-sitter grammar
2. **Compiler** - AST to JavaScript
3. **Runtime** - Thin wrapper for DB, HTTP
4. **CLI** - `cslop run`, `cslop build`
5. **LSP** - Editor support

---

## Design Decisions to Explore

- [ ] Whitespace sensitivity vs braces
- [ ] Implicit semicolons/newlines as terminators
- [ ] Type inference depth
- [ ] Error message verbosity
- [ ] Escape hatch to raw JS
- [ ] Module/import syntax
- [ ] Testing syntax
