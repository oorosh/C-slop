---
sidebar_position: 7
---

# Client-Side Routing

C-slop includes a built-in client-side router for SPA (Single Page Application) navigation.

## Router Configuration

Create a `router.slop` file in your project root:

```
# Syntax: /path > @@Component

/ > @@Home
/about > @@About
/counter > @@Counter
/users/:id > @@UserDetail
```

## Route Patterns

### Static Routes

```
/ > @@Home
/about > @@About
/contact > @@Contact
```

### Dynamic Routes

Use `:param` for dynamic segments:

```
/users/:id > @@UserDetail
/posts/:slug > @@PostDetail
/categories/:category/products/:id > @@ProductDetail
```

## Navigation

### Using @nav

The `@nav` syntax creates SPA-friendly links:

```
a["Home" @nav(/)]
a["About Us" @nav(/about)]
a["User Profile" @nav(/users/123)]
```

This automatically:
- Sets the `href` attribute for accessibility
- Prevents default link behavior
- Uses the History API for navigation
- Updates the URL without page reload

### Button Navigation

Navigation works on any element:

```
button["Go Back" @nav(/)]
div["Click to navigate" @nav(/about)]
```

### Programmatic Navigation

In event handlers, use the `navigate()` function:

```
button["Submit" @click(submitForm)]
```

Where `submitForm` might call `navigate('/success')` after processing.

## Accessing Route Params

### The $route Object

Route parameters are available via the global `$route` signal:

```
$route.path        # Current path, e.g., "/users/123"
$route.params      # Route parameters, e.g., { id: "123" }
$route.query       # Query string params, e.g., { search: "foo" }
```

### Example: User Detail Page

**router.slop:**
```
/users/:id > @@UserDetail
```

**components/UserDetail.ui:**
```
$user:{}
$loading:true

~ fetch("/api/users/" + $route.params.id) > $user > $loading:false

<?

.container.py-8
  ? $loading
    p["Loading..."]

  ? !$loading
    .card
      h1[@{$user.name}]
      p[@{$user.email}]
      a.btn["Back to Users" @nav(/users)]
```

## Query Parameters

### Accessing Query Params

For a URL like `/search?q=hello&page=2`:

```
$route.query.q       # "hello"
$route.query.page    # "2"
```

### Example: Search Page

**router.slop:**
```
/search > @@Search
```

**components/Search.ui:**
```
$results:[]
$query:""

~ $route.query.q > $query
~ fetch("/api/search?q=" + $query) > $results

<?

.container.py-8
  h1["Search Results for: @{$query}"]

  ? $results.length == 0
    p["No results found"]

  $results
    .card.mb-2
      h3[:title]
      p[:description]
```

## Navigation Patterns

### Active Link Styling

```
$currentPath := $route.path

<?

nav.navbar
  a.navbar-item[class{$currentPath == "/" ? "active" : ""} "Home" @nav(/)]
  a.navbar-item[class{$currentPath == "/about" ? "active" : ""} "About" @nav(/about)]
```

### Breadcrumbs

```
.breadcrumb
  a["Home" @nav(/)]
  span["/"]
  a["Users" @nav(/users)]
  span["/"]
  span[@{$user.name}]
```

### Back Button

```
button["Go Back" @click(history.back)]
```

Or navigate to a specific page:

```
a.btn["Back to List" @nav(/users)]
```

## Route Guards

### Protected Routes

Check authentication in your component:

```
$user:{}
$authenticated:false

~ checkAuth() > $authenticated

<?

? !$authenticated
  .container
    p["Please log in to view this page"]
    a.btn.btn-primary["Login" @nav(/login)]

? $authenticated
  .container
    h1["Protected Content"]
    p["Welcome, @{$user.name}!"]
```

## 404 Handling

Create a catch-all route at the end of `router.slop`:

```
/ > @@Home
/about > @@About
/users/:id > @@UserDetail
/* > @@NotFound
```

**components/NotFound.ui:**
```
<?

.container.text-center.py-8
  h1.text-4xl["404"]
  p.text-secondary["Page not found"]
  a.btn.btn-primary["Go Home" @nav(/)]
```

## SPA Fallback

The C-slop server automatically serves `index.html` for any non-API, non-file routes, enabling proper SPA behavior with browser refresh and direct URL access.

## Complete Example

**router.slop:**
```
# Main routes
/ > @@Home
/about > @@About

# User routes
/users > @@UserList
/users/:id > @@UserDetail

# Auth routes
/login > @@Login
/register > @@Register

# 404 fallback
/* > @@NotFound
```

**components/UserList.ui:**
```
$users:[]
$loading:true

~ fetch("/api/users") > $users > $loading:false

<?

.container.py-8
  .flex.justify-between.items-center.mb-4
    h1["Users"]
    a.btn.btn-primary["Add User" @nav(/users/new)]

  ? $loading
    p["Loading..."]

  $users
    .card.mb-2
      .flex.justify-between.items-center
        div
          h3[:name]
          p.text-secondary[:email]
        a.btn.btn-sm["View" @nav(/users/:id)]
```

**components/UserDetail.ui:**
```
$user:{}
$loading:true

~ fetch("/api/users/" + $route.params.id) > $user > $loading:false

<?

.container.py-8
  a.btn.btn-ghost.mb-4["Back to Users" @nav(/users)]

  ? $loading
    p["Loading..."]

  ? !$loading
    .card
      h1[@{$user.name}]
      p.text-secondary[@{$user.email}]
      .mt-4
        span.badge.badge-success["Active"]
```

## Next Steps

- Learn [Frontend Components](/docs/components) for reactive UI
- Explore [SlopUI](/docs/slopui) for styling
- Check [Examples](/docs/examples) for complete apps
