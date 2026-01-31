---
sidebar_position: 2
---

# Syntax Reference

Complete syntax reference for the C-slop language.

## Routes

Routes are first-class language constructs using the `*` symbol.

### Basic Routes

```cslop
// GET route
*/users/:id > @users[$.id] > #json

// POST route
*/users + $.body > @users! > #201

// PUT route
*/users/:id ~ $.body > @users[$.id]! > #json

// DELETE route
*/users/:id - @users[$.id]!- > #204
```

### Routes with Logic 🚧 WIP

```cslop
*/login + {
  u: @users?{email:$.email}[0]
  u.pass == $.pass ? #jwt(u) : #401
}
```

### Middleware 🚧 WIP

```cslop
// Apply to all routes
** > auth($) > _

// Apply to specific paths
*/admin/* > isAdmin($) ? _ : #403

// Response transform
*/api/* >># {data:_, ts:now}
```

## Database Operations

Database tables are accessed with the `@` symbol.

### Select

```cslop
// Select all
@users

// Select specific fields 🚧 WIP
@users[name,email]

// Get by ID
@users[123]

// Filter 🚧 WIP (only simple equality works)
@users?{active:true, age>21}

// Complex query with limit/offset 🚧 WIP
@users?{role:"admin"}[name,email]:10:0
```

### Insert

```cslop
@users!{name:"John", email:"j@x.com"}
```

### Update

```cslop
@users[123]!{name:"Jane"}
```

### Delete

```cslop
@users[123]!-
```

### Joins 🚧 WIP

```cslop
// Implicit join on foreign keys
@users.posts

// Get user with their posts
@users[123].posts
```

### Raw SQL 🚧 WIP

```cslop
@raw("SELECT * FROM users WHERE created_at > NOW() - INTERVAL 7 DAY")
```

## Request Data

Access request data with the `$` symbol.

```cslop
$.params     // URL parameters
$.id         // Shorthand for $.params.id
$.query      // Query string
$.body       // Request body
$.headers    // Headers
$.method     // HTTP method
$.cookies    // Cookies
```

## Response

Send responses with the `#` symbol.

```cslop
#json(data)        // JSON response
#html(content)     // HTML response
#text(str)         // Plain text 🚧 WIP
#file(path)        // File download 🚧 WIP
#redirect(url)     // Redirect 🚧 WIP

// Status codes
#200               // OK
#201               // Created
#204               // No content
#400               // Bad request
#401               // Unauthorized
#403               // Forbidden
#404               // Not found
#500               // Server error

// Set headers/cookies 🚧 WIP
#header(k, v)
#cookie(k, v)
```

## Data Types

### Objects

```cslop
// Object literal (keys without quotes)
{name:"John", age:30, active:true}

// Nested objects
{user:{name:"x"}, meta:{ts:now}}

// Spread operator 🚧 WIP
{...obj, newKey:"val"}

// Destructuring 🚧 WIP
{a,b}: obj  // a=obj.a, b=obj.b
```

### Arrays

```cslop
[1,2,3]
["a","b","c"]
[{id:1},{id:2}]
```

### Access

```cslop
obj.key
arr[0]
obj.nested.deep.value
```

## Functions 🚧 WIP

### Named Functions 🚧 WIP

```cslop
fn add(a,b) a+b

fn validate(user) {
  user.name ? user.email ? true : "no email" : "no name"
}
```

### Arrow Functions 🚧 WIP

```cslop
add: (a,b) a+b

validate: (user) {
  user.name && user.email
}
```

### Pipeline Functions 🚧 WIP

```cslop
*/data > fetch > parse > validate > @store! > #json
```

## Conditionals

### Ternary

```cslop
cond ? yes : no
```

### Multi-Branch 🚧 WIP

```cslop
x ?
  >10 : "big"
  >5  : "med"
  _   : "small"
```

### Guard Clauses 🚧 WIP

```cslop
*/admin > $.role=="admin" ? @data > #json : #403
```

### Nullish Coalescing 🚧 WIP

```cslop
$.title ?? "Untitled"
```

## Loops & Transforms 🚧 WIP

### Map 🚧 WIP

```cslop
@users >> _.name.upper
```

### Filter 🚧 WIP

```cslop
@users >? _.age > 18
```

### Reduce 🚧 WIP

```cslop
@users >+ _.balance : 0
```

### Each (Side Effects) 🚧 WIP

```cslop
@users >! log(_)
```

### Chained Operations 🚧 WIP

```cslop
@users
  >? _.active
  >> {name:_.name, bal:_.balance}
  >+ _.bal : 0
```

## Templates & Rendering 🚧 WIP

### Inline HTML 🚧 WIP

```cslop
~<div>{user.name}</div>
```

### Template Files 🚧 WIP

```cslop
~views/user(user)
```

### Components 🚧 WIP

```cslop
Box: ~<div class="box">{children}</div>
```

### List Rendering 🚧 WIP

```cslop
~<ul>
  {@users >> ~<li>{_.name}</li>}
</ul>
```

### Conditional Rendering 🚧 WIP

```cslop
~<div>
  {user
    ? ~<span>{user.name}</span>
    : ~<span>Guest</span>
  }
</div>
```

## Error Handling 🚧 WIP

### Try-Catch Shorthand 🚧 WIP

```cslop
dangerous >| fallback
```

### Chain with Error 🚧 WIP

```cslop
@users[$.id] >| #404
```

### Multiple Catches 🚧 WIP

```cslop
operation >| {
  NotFound: #404
  AuthErr: #401
  _: #500
}
```

## Built-in Functions

### Utilities

```cslop
now              // Current timestamp
uuid             // Generate UUID
hash(s)          // Hash string
jwt(data)        // JWT encode 🚧 WIP
jwt?(token)      // JWT decode 🚧 WIP
env(key)         // Environment variable
log(x)           // Console log 🚧 WIP
sleep(ms)        // Delay 🚧 WIP
fetch(url)       // HTTP fetch 🚧 WIP
```

### String Methods 🚧 WIP

```cslop
str.upper        // Uppercase
str.lower        // Lowercase
str.trim         // Trim whitespace
str.split(sep)   // Split string
```

### Array Methods 🚧 WIP

```cslop
arr.len          // Length
arr.first        // First element
arr.last         // Last element
arr.join(sep)    // Join to string
```

## Operators

### Comparison

```cslop
==  !=  >  <  >=  <=
```

### Logical

```cslop
&&  ||  !
```

### Arithmetic

```cslop
+  -  *  /  %  **
```

### Pipeline

```cslop
>    // Pipe
>>   // Map 🚧 WIP
>?   // Filter 🚧 WIP
>+   // Reduce 🚧 WIP
>!   // Each 🚧 WIP
>|   // Error catch 🚧 WIP
>>#  // Response transform 🚧 WIP
```

## Comments

```cslop
// Single-line comment

/* Multi-line
   comment */
```

## File Structure

```
app/
  main.slop      # Entry point, routes
  models.slop    # DB schema (optional)
  views/         # Template files
    index.slop
    user.slop
  lib/           # Shared functions
    auth.slop
```

## Schema Definition 🚧 WIP

Optional type hints for database tables:

```cslop
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
