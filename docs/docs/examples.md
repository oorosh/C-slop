---
sidebar_position: 8
---

# Examples

Real-world examples of C-slop full-stack applications.

## Counter App

The classic counter example with SlopUI styling.

**components/Counter.ui:**
```
$count:0
$doubled := $count * 2

<?

.container.text-center.py-8
  .card.mx-auto
    h1.text-4xl.font-bold[@{$count}]
    p.text-secondary["Doubled: @{$doubled}"]
    .flex.gap-2.justify-center.mt-4
      button.btn.btn-secondary["-" @click($count--)]
      button.btn.btn-outline["Reset" @click($count:0)]
      button.btn.btn-primary["+" @click($count++)]
```

---

## Todo App

A complete todo application with API integration.

**api.slop:**
```
// Todo API
*/api/todos > @todos > #json
*/api/todos + @todos!$.body > #json
*/api/todos/:id - @todos[$.id]!- > #204
*/api/todos/:id ^ @todos[$.id]!$.body > #json
```

**components/TodoList.ui:**
```
$todos:[]
$newTodo:""
$loading:true

~ fetch("/api/todos") > $todos > $loading:false

<?

.container.py-8
  h1["My Todos"]

  .flex.gap-2.mb-6
    input.input.flex-1[$newTodo "What needs to be done?"]
    button.btn.btn-primary["Add" @click(post:/api/todos {title:$newTodo,done:false} > $todos + clear)]

  ? $loading
    p.text-center["Loading..."]

  ? $todos.length == 0
    p.text-center.text-secondary["No todos yet. Add one above!"]

  $todos
    .card.mb-2
      .flex.justify-between.items-center
        .flex.items-center.gap-3
          input.checkbox[type{"checkbox"} @click(toggleTodo)]
          span[:title]
        button.btn.btn-sm.btn-error["Delete" @click(delete:/api/todos/:id > $todos - :id)]
```

---

## User Dashboard

Dashboard with stats and user management.

**components/Dashboard.ui:**
```
$stats:{}
$users:[]
$loading:true

~ fetch("/api/stats") > $stats > $loading:false
~ fetch("/api/users") > $users

<?

.container.py-8
  h1.mb-6["Dashboard"]

  // Stats Cards
  .grid.grid-cols-3.gap-4.mb-8
    .card.text-center.p-6
      h2.text-3xl.font-bold[@{$stats.totalUsers}]
      p.text-secondary["Total Users"]
    .card.text-center.p-6
      h2.text-3xl.font-bold[@{$stats.activeToday}]
      p.text-secondary["Active Today"]
    .card.text-center.p-6
      h2.text-3xl.font-bold["$@{$stats.revenue}"]
      p.text-secondary["Revenue"]

  // Recent Users
  .card
    .card-header
      .flex.justify-between.items-center
        h2.card-title["Recent Users"]
        a.btn.btn-sm.btn-primary["View All" @nav(/users)]
    .card-body
      table.table
        thead
          tr
            th["Name"]
            th["Email"]
            th["Status"]
        tbody
          $users
            tr
              td[:name]
              td[:email]
              td
                span.badge.badge-success["Active"]
```

---

## Authentication

Login form with validation.

**components/Login.ui:**
```
$email:""
$password:""
$error:""
$loading:false

<?

.container.py-8
  .card.mx-auto
    h1.card-title.text-center["Login"]

    ? $error
      .alert.alert-error.mb-4[@{$error}]

    .form-group.mb-4
      label["Email"]
      input.input[type{"email"} $email "you@example.com"]

    .form-group.mb-4
      label["Password"]
      input.input[type{"password"} $password "********"]

    button.btn.btn-primary.w-full["Login" @click(handleLogin)]

    p.text-center.mt-4.text-secondary
      span["Don't have an account? "]
      a["Sign up" @nav(/register)]
```

---

## Blog Post

Article display with comments.

**components/BlogPost.ui:**
```
$post:{}
$comments:[]
$newComment:""
$loading:true

~ fetch("/api/posts/" + $route.params.slug) > $post > $loading:false
~ fetch("/api/posts/" + $route.params.slug + "/comments") > $comments

<?

.container.py-8
  a.btn.btn-ghost.mb-4["Back to Blog" @nav(/blog)]

  ? $loading
    p["Loading..."]

  ? !$loading
    article.card
      h1.text-3xl.font-bold[@{$post.title}]
      .flex.gap-2.text-secondary.mb-4
        span["By @{$post.author}"]
        span["|"]
        span[@{$post.date}]
      .prose[@{$post.content}]

    // Comments Section
    .mt-8
      h2.text-xl.font-bold.mb-4["Comments (@{$comments.length})"]

      .flex.gap-2.mb-4
        input.input.flex-1[$newComment "Write a comment..."]
        button.btn.btn-primary["Post" @click(postComment)]

      $comments
        .card.mb-2
          .flex.justify-between
            span.font-bold[:author]
            span.text-secondary[:date]
          p.mt-2[:text]
```

---

## Product Card

E-commerce product display.

**components/ProductCard.ui:**
```
$quantity:1

<?

.card
  img.w-full[src{$product.image} alt{$product.name}]
  .card-body
    .flex.justify-between.items-start
      h3.card-title[@{$product.name}]
      span.text-xl.font-bold["$@{$product.price}"]
    p.text-secondary[@{$product.description}]
    .flex.gap-2.mt-4
      .flex.items-center.gap-2
        button.btn.btn-sm["-" @click($quantity > 1 ? $quantity-- : null)]
        span[@{$quantity}]
        button.btn.btn-sm["+" @click($quantity++)]
      button.btn.btn-primary.flex-1["Add to Cart" @click(addToCart)]
```

---

## Settings Page

Form with multiple inputs and theme toggle.

**components/Settings.ui:**
```
$name:""
$email:""
$notifications:true
$saved:false

~ loadSettings() > {$name, $email, $notifications}

<?

.container.py-8
  h1.mb-6["Settings"]

  .card
    .card-body
      h2.card-title["Profile"]

      .form-group.mb-4
        label["Name"]
        input.input[$name "Your name"]

      .form-group.mb-4
        label["Email"]
        input.input[type{"email"} $email "you@example.com"]

      .form-group.mb-4
        .flex.justify-between.items-center
          label["Email Notifications"]
          input.toggle[type{"checkbox"}]

      button.btn.btn-primary["Save Changes" @click(saveSettings)]

      ? $saved
        .alert.alert-success.mt-4["Settings saved successfully!"]

  .card.mt-6
    .card-body
      h2.card-title["Appearance"]
      .flex.justify-between.items-center
        div
          h3["Dark Mode"]
          p.text-secondary["Toggle between light and dark theme"]
        button.btn.btn-secondary["Toggle Theme" @click(toggleTheme)]
```

---

## Navigation Header

Reusable navigation component.

**components/Header.ui:**
```
<?

nav.navbar
  .navbar-brand
    a.font-bold.text-xl["MyApp" @nav(/)]

  .navbar-menu
    a.navbar-item["Home" @nav(/)]
    a.navbar-item["Products" @nav(/products)]
    a.navbar-item["About" @nav(/about)]

  .flex.gap-2
    button.btn.btn-ghost.btn-sm["Toggle Theme" @click(toggleTheme)]
    a.btn.btn-primary.btn-sm["Sign In" @nav(/login)]
```

---

## Complete App Structure

A full application with all pieces together:

**router.slop:**
```
/ > @@Home
/products > @@ProductList
/products/:id > @@ProductDetail
/cart > @@Cart
/login > @@Login
/register > @@Register
/settings > @@Settings
/* > @@NotFound
```

**api.slop:**
```
// Health check
*/api/health > #json({status:"ok"})

// Products
*/api/products > @products > #json
*/api/products/:id > @products[$.id] > #json

// Cart
*/api/cart > @cart > #json
*/api/cart + @cart!$.body > #json
*/api/cart/:id - @cart[$.id]!- > #204

// Users
*/api/users > @users > #json
*/api/users + @users!$.body > #json
```

**slop.json:**
```json
{
  "name": "my-store",
  "database": {
    "type": "sqlite",
    "connection": "./store.db"
  },
  "server": {
    "port": 3000,
    "static": "./dist"
  },
  "theme": {
    "light": {
      "primary": "#2563eb",
      "success": "#16a34a"
    },
    "dark": {
      "primary": "#3b82f6",
      "success": "#22c55e"
    }
  }
}
```

---

## Token Comparison

| Feature | JavaScript/React | C-slop | Reduction |
|---------|-----------------|--------|-----------|
| Counter component | ~50 lines | ~15 lines | 70% |
| Todo list | ~100 lines | ~30 lines | 70% |
| API endpoint | ~10 lines | ~1 line | 90% |
| Form with validation | ~80 lines | ~25 lines | 69% |
| Full CRUD app | ~300 lines | ~80 lines | 73% |

---

## Next Steps

- Learn [Frontend Components](/docs/components) for UI development
- Explore [SlopUI](/docs/slopui) for styling
- Check [Client Routing](/docs/client-routing) for navigation
