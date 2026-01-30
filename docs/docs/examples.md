---
sidebar_position: 3
---

# Examples

Real-world examples of C-slop in action.

## Complete Todo API

A full CRUD API for a todo application:

```cslop
// Config
@:postgres(env(DB_URL))

// Middleware - JWT authentication
*/api/* > jwt?($.headers.auth) ? {user:_} : #401

// List todos for current user
*/api/todos > @todos?{userId:$.user.id} > #json

// Get single todo
*/api/todos/:id > @todos[$.id] > #json

// Create todo
*/api/todos + {
  $.body.title ?? #400("title required")
  {...$.body, userId:$.user.id, ts:now} > @todos! > #201
}

// Update todo
*/api/todos/:id ~ $.body > @todos[$.id]! > #json

// Delete todo
*/api/todos/:id - @todos[$.id]!- > #204
```

**Lines**: 15
**Tokens**: ~60
**Equivalent Express.js**: ~80 lines, ~400 tokens

---

## User Authentication

Complete auth system with registration, login, and protected routes:

```cslop
// Register new user
*/auth/register + {
  // Validate input
  $.body.email ?? #400("email required")
  $.body.pass ?? #400("password required")

  // Check if user exists
  @users?{email:$.body.email}[0] ? #400("email exists") : _

  // Create user with hashed password
  {
    email: $.body.email,
    pass: hash($.body.pass),
    ts: now
  } > @users! > {token: jwt(_)} > #json
}

// Login
*/auth/login + {
  u: @users?{email:$.body.email}[0]
  u ?? #401("invalid credentials")
  u.pass == hash($.body.pass)
    ? {token: jwt({id:u.id, email:u.email})}
    : #401("invalid credentials")
  > #json
}

// Protected route
*/profile > {
  jwt?($.headers.auth) ?? #401
  @users[_.id] > #json
}
```

---

## Blog Platform

A simple blog with posts, comments, and authors:

```cslop
// List all posts with author info
*/posts > @posts.users[title,body,createdAt,users.name] > #json

// Get single post with comments
*/posts/:id > {
  post: @posts[$.id].users
  comments: @comments?{postId:$.id}.users
  {post, comments}
} > #json

// Create post
*/posts + {
  jwt?($.headers.auth) ?? #401
  {
    ...$.body,
    userId: _.id,
    createdAt: now
  } > @posts! > #201
}

// Add comment
*/posts/:id/comments + {
  jwt?($.headers.auth) ?? #401
  {
    postId: $.id,
    userId: _.id,
    body: $.body.text,
    createdAt: now
  } > @comments! > #201
}

// Render blog homepage
*/ > {
  posts: @posts.users[:10]
  ~views/blog({posts})
} > #html
```

---

## E-commerce Cart

Shopping cart with products and orders:

```cslop
// Get products
*/products > @products?{active:true} > #json

// Get product by ID
*/products/:id > @products[$.id] >| #404 > #json

// Add to cart
*/cart + {
  jwt?($.headers.auth) ?? #401
  product: @products[$.body.productId]
  {
    userId: _.id,
    productId: product.id,
    quantity: $.body.quantity,
    price: product.price
  } > @cart! > #201
}

// Get cart
*/cart > {
  jwt?($.headers.auth) ?? #401
  items: @cart?{userId:_.id}.products
  total: items >+ _.price * _.quantity : 0
  {items, total}
} > #json

// Checkout
*/checkout + {
  jwt?($.headers.auth) ?? #401
  cartItems: @cart?{userId:_.id}
  total: cartItems >+ _.price * _.quantity : 0

  // Create order
  order: {userId:_.id, total, ts:now} > @orders!

  // Clear cart
  @cart?{userId:_.id} >! @cart[_.id]!-

  {orderId: order.id, total} > #json
}
```

---

## File Upload & Storage

Handle file uploads and serve static files:

```cslop
// Upload file
*/upload + {
  jwt?($.headers.auth) ?? #401
  $.files.image ?? #400("no file")

  filename: uuid + "." + $.files.image.ext
  path: "uploads/" + filename

  $.files.image > save(path)

  {
    userId: _.id,
    filename,
    path,
    size: $.files.image.size,
    ts: now
  } > @files! > #json
}

// Get user's files
*/files > {
  jwt?($.headers.auth) ?? #401
  @files?{userId:_.id} > #json
}

// Download file
*/files/:id > {
  file: @files[$.id]
  file ?? #404
  #file(file.path)
}

// Delete file
*/files/:id - {
  jwt?($.headers.auth) ?? #401
  file: @files[$.id]
  file.userId == _.id ?? #403
  delete(file.path)
  @files[$.id]!- > #204
}
```

---

## Real-time Dashboard

Server-sent events for real-time updates:

```cslop
// Stream analytics data
*/analytics/stream > {
  jwt?($.headers.auth) ?? #401

  #sse > {
    loop: {
      data: {
        users: @users.count,
        active: @sessions?{active:true}.count,
        revenue: @orders?{ts>now-86400} >+ _.total : 0
      }
      #send(data)
      sleep(5000)
    }
  }
}

// Get dashboard data
*/dashboard > {
  jwt?($.headers.auth) ?? #401

  stats: {
    totalUsers: @users.count,
    activeToday: @sessions?{createdAt>now-86400}.count,
    revenue: @orders >+ _.total : 0,
    orders: @orders[:10].users
  }

  ~views/dashboard(stats) > #html
}
```

---

## Search & Pagination

Full-text search with pagination:

```cslop
// Search products
*/search > {
  q: $.query.q ?? ""
  page: $.query.page ?? 0
  limit: 20

  results: @products?{name~q || desc~q}[:limit:page*limit]
  total: @products?{name~q || desc~q}.count

  {
    results,
    total,
    page,
    pages: total / limit
  } > #json
}

// Browse with filters
*/products > {
  filters: {
    category: $.query.category,
    minPrice: $.query.min,
    maxPrice: $.query.max
  }

  query: {
    category: filters.category ?? _,
    price >= filters.minPrice ?? 0,
    price <= filters.maxPrice ?? 999999
  }

  @products?query[:20:$.query.page*20] > #json
}
```

---

## Webhook Handler

Process incoming webhooks:

```cslop
// Stripe webhook
*/webhooks/stripe + {
  // Verify signature
  sig: $.headers["stripe-signature"]
  verify($.body, sig, env(STRIPE_SECRET)) ?? #401

  // Handle event
  $.body.type ?
    "payment.success": {
      {
        orderId: $.body.data.metadata.orderId,
        status: "paid",
        paidAt: now
      } > @orders[orderId]!
      #200
    }
    "payment.failed": {
      {orderId: $.body.data.metadata.orderId, status: "failed"}
      > @orders[orderId]!
      #200
    }
    _: #200
}
```

---

## Comparison: Token Count

| Feature | JavaScript | C-slop | Savings |
|---------|-----------|--------|---------|
| Simple GET endpoint | 45 tokens | 8 tokens | 82% |
| POST with validation | 60 tokens | 15 tokens | 75% |
| Full CRUD API | 200 tokens | 40 tokens | 80% |
| Auth system | 150 tokens | 35 tokens | 77% |
| List with filter/map | 30 tokens | 10 tokens | 67% |

---

## Next Steps

- Review the [Syntax Reference](/docs/syntax) for detailed syntax
- Learn [Database Operations](/docs/database) patterns
- Explore [Routing](/docs/routing) best practices
- Try the [Playground](/docs/playground) to experiment
