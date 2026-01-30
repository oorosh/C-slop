---
sidebar_position: 5
---

# Routing

HTTP routing is a first-class feature in C-slop using the `*` symbol.

## Basic Routes

### HTTP Methods

```cslop
// GET (default)
*/users > @users > #json

// POST
*/users + @users!$.body > #201

// PUT
*/users/:id ~ @users[$.id]!$.body > #json

// DELETE
*/users/:id - @users[$.id]!- > #204

// PATCH
*/users/:id ~ @users[$.id]!$.body > #json
```

### URL Parameters

```cslop
*/users/:id > @users[$.id] > #json
*/posts/:postId/comments/:commentId > {
  post: @posts[$.postId]
  comment: @comments[$.commentId]
  {post, comment}
} > #json
```

Access parameters via `$.id`, `$.postId`, etc.

### Query Strings

```cslop
*/search > {
  q: $.query.q
  page: $.query.page ?? 0
  @products?{name~q}[:20:page*20]
} > #json
```

Access via `$.query.<param>`.

## Request Data

### Request Body

```cslop
*/users + {
  name: $.body.name
  email: $.body.email
  @users!{name, email}
} > #json
```

### Headers

```cslop
*/protected > {
  token: $.headers.authorization
  jwt?(token) ?? #401
  #json({user:_})
}
```

### Cookies

```cslop
*/profile > {
  sessionId: $.cookies.session
  // Use session
} > #json
```

### Files

```cslop
*/upload + {
  file: $.files.image
  file ?? #400("no file")
  // Process file
} > #json
```

## Responses

### JSON Response

```cslop
*/users > @users > #json
```

### HTML Response

```cslop
*/ > ~<h1>Welcome</h1> > #html
```

### Status Codes

```cslop
*/users + @users!$.body > #201

*/users/:id > @users[$.id] >| #404 > #json

*/error > #500("Internal error")
```

### Headers

```cslop
*/api/data > {
  data: @items
  #header("X-Total-Count", data.count)
  #json(data)
}
```

### Cookies

```cslop
*/login + {
  user: authenticate($.body)
  token: jwt(user)
  #cookie("token", token, {httpOnly:true, maxAge:86400})
  #json({user, token})
}
```

### Redirects

```cslop
*/old-url > #redirect("/new-url")

*/login + {
  authenticate($.body)
  #redirect("/dashboard")
}
```

### File Downloads

```cslop
*/download/:id > {
  file: @files[$.id]
  #file(file.path, file.name)
}
```

## Middleware

### Global Middleware

Apply to all routes:

```cslop
// Logging
** > {
  log($.method, $.path)
  _  // Continue to route
}

// CORS
** > {
  #header("Access-Control-Allow-Origin", "*")
  _
}
```

### Path-Based Middleware

```cslop
// Require auth for /api routes
*/api/* > {
  jwt?($.headers.auth) ?? #401
  _  // Continue with user in context
}

// Admin only
*/admin/* > {
  jwt?($.headers.auth) ?? #401
  _.role == "admin" ? _ : #403
}
```

### Response Transform

Apply transformations to responses:

```cslop
// Add timestamp to all API responses
*/api/* >># {
  data: _,
  timestamp: now
}

// Wrap in success envelope
*/api/* >># {
  success: true,
  data: _
}
```

## Route Organization

### Modular Routes

Split routes across files:

```cslop
// routes/users.slop
export {
  */users > @users > #json
  */users/:id > @users[$.id] > #json
  */users + @users!$.body > #201
  */users/:id ~ @users[$.id]!$.body > #json
  */users/:id - @users[$.id]!- > #204
}

// routes/posts.slop
export {
  */posts > @posts.users > #json
  */posts/:id > @posts[$.id].users > #json
  // ... more routes
}

// main.slop
import "./routes/users"
import "./routes/posts"
```

### Prefix Groups

```cslop
// Group routes under a prefix
prefix("/api/v1", {
  */users > @users > #json
  */posts > @posts > #json
  */comments > @comments > #json
})

// Becomes:
// GET /api/v1/users
// GET /api/v1/posts
// GET /api/v1/comments
```

## Advanced Patterns

### Validation

```cslop
validate: (schema, data) {
  // Simple validation
  schema >> {
    key: _
    val: schema[key]
    val.required && !data[key] ? throw("missing: " + key) : _
  }
  data
}

*/users + {
  schema: {
    name: {required:true},
    email: {required:true, email:true}
  }
  validate(schema, $.body)
  @users!$.body > #201
}
```

### Pagination

```cslop
paginate: (data, page, size) {
  offset: page * size
  items: data[:size:offset]
  {
    items,
    page,
    size,
    total: data.count,
    pages: (data.count / size) + 1
  }
}

*/users > {
  page: $.query.page ?? 0
  paginate(@users, page, 20)
} > #json
```

### Rate Limiting

```cslop
rateLimit: (key, max, window) {
  count: @rateLimit?{key, ts>now-window}.count
  count > max ? #429("Too many requests") : _
  @rateLimit!{key, ts:now}
}

*/api/* > rateLimit($.ip, 100, 3600) > _
```

### Caching

```cslop
cache: (key, ttl, fn) {
  cached: @cache?{key, expires>now}[0]
  cached
    ? cached.value
    : {
        value: fn()
        @cache!{key, value, expires:now+ttl}
        value
      }
}

*/expensive > cache("expensive:" + $.query.param, 300, {
  // Expensive operation
  @data > complexTransform > result
}) > #json
```

### Webhooks

```cslop
*/webhooks/stripe + {
  // Verify signature
  sig: $.headers["stripe-signature"]
  verify($.body, sig, env(STRIPE_SECRET)) ?? #401

  // Process event
  $.body.type ?
    "charge.succeeded": processPayment($.body.data)
    "customer.created": createCustomer($.body.data)
    _: log("Unknown event:", $.body.type)

  #200
}
```

### Server-Sent Events

```cslop
*/events > {
  jwt?($.headers.auth) ?? #401

  #sse > {
    loop({
      event: getLatestEvent()
      #send(event)
      sleep(1000)
    })
  }
}
```

### WebSockets

```cslop
*/ws > {
  jwt?($.query.token) ?? #401

  #ws > {
    onMessage: (msg) {
      broadcast(msg)
    }
    onConnect: {
      #send({type:"welcome", user:_.name})
    }
  }
}
```

## Error Handling

### Route-Level Errors

```cslop
*/users/:id > @users[$.id] >| #404 > #json
```

### Global Error Handler

```cslop
** >| {
  NotFound: #404({error:"Not found"})
  Unauthorized: #401({error:"Unauthorized"})
  ValidationError: #400({error:_.message})
  _: #500({error:"Internal server error"})
}
```

### Custom Error Types

```cslop
*/users/:id > {
  user: @users[$.id]
  user ?? throw(NotFound("User not found"))
  user.active ?? throw(Forbidden("User inactive"))
  #json(user)
}
```

## Route Matching

### Wildcards

```cslop
// Match any path under /static
*/static/* > #file("public/" + $.path)

// Catch-all
*/* > #404
```

### Optional Parameters

```cslop
*/users/:id? > {
  $.id
    ? @users[$.id]
    : @users
  > #json
}
```

### Regex Patterns

```cslop
// Only numeric IDs
*/users/:id([0-9]+) > @users[$.id] > #json

// Validate format
*/posts/:slug([a-z0-9-]+) > @posts?{slug:$.slug}[0] > #json
```

## Performance

### Conditional Responses

```cslop
*/users > {
  etag: hash(@users.max(updatedAt))
  $.headers["if-none-match"] == etag
    ? #304
    : {
        #header("ETag", etag)
        @users > #json
      }
}
```

### Compression

```cslop
// Automatic gzip compression
*/api/* > compress > _
```

### Streaming

```cslop
*/export > {
  jwt?($.headers.auth) ?? #401

  #stream > {
    @users >! {
      #write(csv(_))
    }
  }
}
```

## Testing Routes

```cslop
// test/routes.test.slop
test("GET /users returns users", {
  res: request.get("/users")
  assert(res.status == 200)
  assert(res.body.length > 0)
})

test("POST /users creates user", {
  user: {name:"Test", email:"test@x.com"}
  res: request.post("/users", user)
  assert(res.status == 201)
  assert(res.body.email == user.email)
})
```

## Best Practices

1. **Use middleware** for cross-cutting concerns (auth, logging)
2. **Validate input** at the route level
3. **Return appropriate status codes** (200, 201, 404, etc.)
4. **Handle errors gracefully** with `>|` operator
5. **Group related routes** in modules
6. **Use route prefixes** for versioning (`/api/v1`)
7. **Document your APIs** with comments
8. **Test your routes** thoroughly

## Next Steps

- Learn [Database Operations](/docs/database) for data handling
- Check [Examples](/docs/examples) for complete applications
- Review [Syntax Reference](/docs/syntax) for all operators
