---
sidebar_position: 4
---

# Database Operations

C-slop treats databases as first-class citizens with the `@` symbol providing direct table access.

## Configuration

Configure your database connection at the start of your app:

```cslop
// PostgreSQL
@:postgres(env(DB_URL))

// MySQL
@:mysql(env(DB_URL))

// SQLite
@:sqlite("./db.sqlite")

// MongoDB
@:mongo(env(MONGO_URL))
```

## Basic Operations

### Select All

```cslop
@users
```

Returns all rows from the users table.

### Select by ID

```cslop
@users[123]
```

Get a single record by primary key.

### Select Specific Fields

```cslop
@users[name, email]
```

Only return the `name` and `email` columns.

### Combine ID and Fields

```cslop
@users[123][name, email]
```

Get specific fields for a single record.

## Filtering

Use the `?` operator to filter results:

### Simple Filter

```cslop
@users?{active:true}
```

### Multiple Conditions (AND)

```cslop
@users?{active:true, role:"admin"}
```

### Comparison Operators

```cslop
// Greater than
@users?{age>18}

// Less than
@products?{price<100}

// Greater than or equal
@orders?{total>=50}

// Not equal
@users?{status!="banned"}
```

### String Matching

```cslop
// Contains (LIKE %query%)
@users?{name~"john"}

// Starts with
@users?{email^"admin@"}

// Ends with
@users?{email$"@company.com"}
```

### OR Conditions

```cslop
@users?{role:"admin" || role:"moderator"}
```

### IN Operator

```cslop
@users?{id:[1,2,3,4,5]}
```

### Null Checks

```cslop
// IS NULL
@users?{deletedAt:null}

// IS NOT NULL
@users?{deletedAt!null}
```

## Sorting

```cslop
// Ascending (default)
@users^name

// Descending
@users^-createdAt

// Multiple sorts
@users^-createdAt^name
```

## Pagination

Use `:limit:offset` syntax:

```cslop
// First 10 records
@users:10

// Skip 20, take 10
@users:10:20

// With filter and sort
@users?{active:true}^-createdAt:20:0
```

## Insert

Use the `!` operator to insert data:

```cslop
@users!{
  name: "John Doe",
  email: "john@example.com",
  createdAt: now
}
```

Returns the inserted record with generated ID.

### Bulk Insert

```cslop
@users![
  {name:"Alice", email:"alice@x.com"},
  {name:"Bob", email:"bob@x.com"},
  {name:"Charlie", email:"charlie@x.com"}
]
```

## Update

Combine ID selection with `!` to update:

```cslop
@users[123]!{
  name: "Jane Doe",
  updatedAt: now
}
```

### Conditional Update

```cslop
@users?{email:"old@x.com"}!{email:"new@x.com"}
```

Updates all matching records.

## Delete

Use `!-` to delete:

```cslop
// Delete by ID
@users[123]!-

// Delete with filter
@users?{inactive:true, createdAt<now-31536000}!-
```

## Joins

C-slop automatically joins tables using foreign key relationships:

```cslop
// Get users with their posts
@users.posts

// Get posts with author info
@posts.users

// Get specific user's posts
@users[123].posts

// Get post with author
@posts[456].users
```

### Multiple Joins

```cslop
// Posts with author and comments
@posts.users.comments
```

### Select Fields Across Joins

```cslop
@posts.users[
  posts.title,
  posts.body,
  users.name,
  users.email
]
```

## Aggregations

### Count

```cslop
@users.count
@users?{active:true}.count
```

### Sum

```cslop
@orders.sum(total)
@orders?{status:"paid"}.sum(total)
```

### Average

```cslop
@products.avg(price)
```

### Min/Max

```cslop
@products.min(price)
@products.max(price)
```

### Group By

```cslop
@orders.group(userId).sum(total)
```

## Transactions

Wrap operations in a transaction:

```cslop
@tx({
  // Deduct from sender
  @accounts[fromId]!{balance: _.balance - amount}

  // Add to recipient
  @accounts[toId]!{balance: _.balance + amount}

  // Create transfer record
  @transfers!{fromId, toId, amount, ts:now}
})
```

If any operation fails, all changes are rolled back.

## Raw SQL

For complex queries not covered by the DSL:

```cslop
@raw("
  SELECT u.name, COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON u.id = p.user_id
  GROUP BY u.id
  HAVING post_count > 10
")
```

### Parameterized Queries

```cslop
@raw("SELECT * FROM users WHERE email = ?", [$.query.email])
```

## Schema Definition

Optional schema hints for type safety and migrations:

```cslop
@users: {
  id: int.pk.auto              // Primary key, auto-increment
  name: str.required           // Required string
  email: str.unique            // Unique constraint
  age: int                     // Optional integer
  bio: text                    // Long text
  active: bool.default(true)   // Boolean with default
  role: enum("user", "admin")  // Enum type
  balance: decimal(10,2)       // Decimal with precision
  avatar: str.nullable         // Explicitly nullable
  createdAt: time.default(now) // Timestamp
  updatedAt: time.onUpdate(now)// Auto-update timestamp
}

@posts: {
  id: int.pk.auto
  userId: int.fk(@users)       // Foreign key to users table
  title: str
  body: text
  published: bool.default(false)
  createdAt: time.default(now)
}

@comments: {
  id: int.pk.auto
  postId: int.fk(@posts)
  userId: int.fk(@users)
  body: text
  createdAt: time.default(now)
}
```

## Indexes

Define indexes for performance:

```cslop
@users.index(email)
@posts.index(userId, createdAt)
@posts.index.unique(slug)
@products.index.fulltext(name, description)
```

## Migrations

Generate migrations from schema changes:

```bash
cslop migrate:make "add_users_table"
cslop migrate:run
cslop migrate:rollback
```

## Common Patterns

### Soft Deletes

```cslop
// Instead of deleting, mark as deleted
@users[123]!{deletedAt: now}

// Query only active records
@users?{deletedAt:null}
```

### Timestamps

```cslop
// Create
@users!{
  name: $.body.name,
  createdAt: now,
  updatedAt: now
}

// Update
@users[123]!{
  name: $.body.name,
  updatedAt: now
}
```

### Pagination Helper

```cslop
paginate: (query, page, size) {
  offset: page * size
  items: query[:size:offset]
  total: query.count
  {items, total, page, pages: total/size}
}

// Usage
^/users > paginate(@users, $.query.page ?? 0, 20) > #json
```

### Search

```cslop
search: (table, fields, query) {
  // Build OR conditions for multiple fields
  conditions: fields >> {[_]:~query}
  table?conditions
}

// Usage
^/search > search(@products, [name, description], $.query.q) > #json
```

## Performance Tips

1. **Use indexes** on frequently queried columns
2. **Select specific fields** instead of returning all columns
3. **Limit results** with pagination
4. **Use joins** instead of multiple queries
5. **Cache frequent queries** when data doesn't change often
6. **Use transactions** for multi-step operations

## Error Handling

```cslop
// Catch not found
@users[$.id] >| #404

// Catch unique constraint violation
@users!{email:$.body.email} >| {
  UniqueViolation: #400("email already exists")
  _: #500
}

// Validate before insert
^/users + {
  @users?{email:$.body.email}[0] ? #400("email exists") : _
  @users!$.body > #201
}
```

## Next Steps

- Review [Syntax Reference](/docs/syntax) for complete query syntax
- Check [Examples](/docs/examples) for real-world usage
- Learn about [Routing](/docs/routing) to build complete APIs
