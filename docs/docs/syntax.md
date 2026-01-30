---
sidebar_position: 2
---

# Syntax Reference

Complete syntax reference for the C-slop language.

## Routes

Routes are first-class language constructs using the `^` symbol.

### Basic Routes

```cslop
// GET route
^/users/:id > @users[$.id] > #json

// POST route
^/users + $.body > @users! > #201

// PUT route
^/users/:id ~ $.body > @users[$.id]! > #json

// DELETE route
^/users/:id - @users[$.id]!- > #204
```

### Routes with Logic

```cslop
^/login + {
  u: @users?{email:$.email}[0]
  u.pass == $.pass ? #jwt(u) : #401
}
```

### Middleware

```cslop
// Apply to all routes
^* > auth($) > _

// Apply to specific paths
^/admin/* > isAdmin($) ? _ : #403

// Response transform
^/api/* >># {data:_, ts:now}
```

## Database Operations

Database tables are accessed with the `@` symbol.

### Select

```cslop
// Select all
@users

// Select specific fields
@users[name,email]

// Get by ID
@users[123]

// Filter
@users?{active:true, age>21}

// Complex query with limit/offset
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

### Joins

```cslop
// Implicit join on foreign keys
@users.posts

// Get user with their posts
@users[123].posts
```

### Raw SQL

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
#text(str)         // Plain text
#file(path)        // File download
#redirect(url)     // Redirect

// Status codes
#200               // OK
#201               // Created
#204               // No content
#400               // Bad request
#401               // Unauthorized
#403               // Forbidden
#404               // Not found
#500               // Server error

// Set headers/cookies
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

// Spread operator
{...obj, newKey:"val"}

// Destructuring
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

## Functions

### Named Functions

```cslop
fn add(a,b) a+b

fn validate(user) {
  user.name ? user.email ? true : "no email" : "no name"
}
```

### Arrow Functions

```cslop
add: (a,b) a+b

validate: (user) {
  user.name && user.email
}
```

### Pipeline Functions

```cslop
^/data > fetch > parse > validate > @store! > #json
```

## Conditionals

### Ternary

```cslop
cond ? yes : no
```

### Multi-Branch

```cslop
x ?
  >10 : "big"
  >5  : "med"
  _   : "small"
```

### Guard Clauses

```cslop
^/admin > $.role=="admin" ? @data > #json : #403
```

### Nullish Coalescing

```cslop
$.title ?? "Untitled"
```

## Loops & Transforms

### Map

```cslop
@users >> _.name.upper
```

### Filter

```cslop
@users >? _.age > 18
```

### Reduce

```cslop
@users >+ _.balance : 0
```

### Each (Side Effects)

```cslop
@users >! log(_)
```

### Chained Operations

```cslop
@users
  >? _.active
  >> {name:_.name, bal:_.balance}
  >+ _.bal : 0
```

## Templates & Rendering

### Inline HTML

```cslop
~<div>{user.name}</div>
```

### Template Files

```cslop
~views/user(user)
```

### Components

```cslop
Box: ~<div class="box">{children}</div>
```

### List Rendering

```cslop
~<ul>
  {@users >> ~<li>{_.name}</li>}
</ul>
```

### Conditional Rendering

```cslop
~<div>
  {user
    ? ~<span>{user.name}</span>
    : ~<span>Guest</span>
  }
</div>
```

## Error Handling

### Try-Catch Shorthand

```cslop
dangerous >| fallback
```

### Chain with Error

```cslop
@users[$.id] >| #404
```

### Multiple Catches

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
jwt(data)        // JWT encode
jwt?(token)      // JWT decode
env(key)         // Environment variable
log(x)           // Console log
sleep(ms)        // Delay
fetch(url)       // HTTP fetch
```

### String Methods

```cslop
str.upper        // Uppercase
str.lower        // Lowercase
str.trim         // Trim whitespace
str.split(sep)   // Split string
```

### Array Methods

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
>>   // Map
>?   // Filter
>+   // Reduce
>!   // Each
>|   // Error catch
>>#  // Response transform
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

## Schema Definition

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
