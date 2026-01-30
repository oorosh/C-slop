---
sidebar_position: 1
---

# Getting Started

Welcome to **C-slop** - a token-minimal programming language designed for web applications.

## What is C-slop?

C-slop is a programming language optimized for **machine efficiency** - specifically, minimizing tokens while maintaining expressiveness for common web operations: routing, database CRUD, rendering, and input processing. It achieves **75-82% token reduction** compared to JavaScript for typical web development tasks.

### Why C-slop?

- **Token-Minimal**: Write web apps in 80% fewer tokens - perfect for AI-assisted development
- **Symbol-Based**: Uses `@`, `$`, `#`, `>` instead of keywords
- **Built-in Web Primitives**: Routes, database, and HTML are first-class language features
- **Pipeline-First**: Data flows naturally through `>` operators
- **Implicit Everything**: Types, returns, and async operations are automatically inferred

## Quick Example

Here's a complete REST API endpoint in C-slop:

```cslop
*/users/:id > @users[$.id] > #json
```

The equivalent in JavaScript/Express:

```javascript
app.get('/users/:id', async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(user);
});
```

**That's 8 tokens vs 47 tokens** - an 83% reduction.

## Installation

```bash
npm install -g cslop
```

## Your First C-slop App

Create a file `app.slop`:

```cslop
// Database configuration
@:postgres(env(DB_URL))

// Routes
*/          > #html(~<h1>Hello C-slop!</h1>)
*/api/users > @users > #json
```

Run it:

```bash
cslop run app.slop
```

Your server is now running at `http://localhost:3000`!

## Core Concepts

C-slop is built on a few core principles:

1. **Symbols over keywords** - Single characters replace verbose keywords
2. **Pipeline-first** - Data flows through `>` operators
3. **Implicit everything** - The compiler infers types, returns, and async
4. **Convention over configuration** - Sensible defaults everywhere
5. **Built-in web primitives** - Routes, DB, HTML are part of the language

## Symbol Overview

| Symbol | Meaning | Example |
|--------|---------|---------|
| `*` | Route definition | `*/users` |
| `@` | Database table | `@users` |
| `$` | Request/Input | `$.id`, `$.body` |
| `#` | Response/Output | `#json`, `#html` |
| `>` | Pipe/Flow | `a > b > c` |
| `?` | Query/Filter | `@users?{age>18}` |
| `!` | Action/Mutation | `@users!{name:"x"}` |
| `~` | Template/Render | `~<div>...</div>` |
| `&` | Parallel execution | `a & b` |
| `_` | Current context | `_.name` |

## Next Steps

- Learn the [Syntax Reference](/docs/syntax) for complete language details
- Browse [Examples](/docs/examples) to see C-slop in action
- Explore [Database Operations](/docs/database) for data handling
- Check out [Routing](/docs/routing) for HTTP endpoint patterns

## Philosophy

C-slop is designed for the AI era. When working with LLMs like Claude or GPT-4, token count directly impacts:
- Context window usage
- API costs
- Response time
- Code comprehension

By reducing boilerplate to the absolute minimum, C-slop lets you build more with less.
