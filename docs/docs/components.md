---
sidebar_position: 5
---

# Frontend Components

UI components in C-slop use `.ui` files with a simple, reactive syntax.

## File Structure

```
// Comment

$state:0             // State declaration
$computed := expr    // Computed state
~ effect             // Side effect

<?                   // Template separator

div.class&id         // Markup (& is alias for #id)
  @@ChildComponent   // Child component
```

## State

### Reactive State

```
$count:0             // Number
$name:""             // String
$items:[]            // Array
$user:{}             // Object
$active:true         // Boolean
```

### Computed State

Derived values that update automatically:

```
$count:0
$doubled := $count * 2
$message := "Count is " + $count
```

## Effects

Side effects run on mount and when dependencies change:

```
// Fetch data on mount
~ fetch("/api/users") > $users

// Chain assignments
~ fetch("/api/data") > $data > $loading:false

// Conditional effect
~ $condition > doSomething
```

## Markup

### Elements

```
div                      // Element
.container               // div with class
div.foo.bar              // Multiple classes
div&main                 // With ID (& is alias for #)
div.container&main       // Combined
```

### Text Content

```
h1["Hello World"]
p["Count: @{$count}"]    // Reactive interpolation
span["Static text"]
```

### Nesting (Indentation-Based)

```
div.container
  h1["Title"]
  p["Paragraph"]
  div.nested
    span["Deep nesting"]
```

## Events

Vue/React-like event syntax:

```
// Click handlers
button["+" @click($count++)]
button["-" @click($count--)]
button["Reset" @click($count:0)]
button["Save" @click(handleSave)]

// Input handlers
input[@input($text:e.target.value)]

// Form submit
form[@submit(handleSubmit)]

// Multiple events
div[@mouseenter(show) @mouseleave(hide)]
```

## Attributes

### Static Attributes

```
img[alt{"Profile picture"}]
a[target{"_blank"}]
input[type{"email"} placeholder{"Enter email"}]
```

### Dynamic Attributes

```
img[src{$imageUrl}]
a[href{$link}]
div[class{$activeClass}]
input[disabled{$isDisabled}]
```

### Mixed

```
img[src{$imageUrl} alt{"User avatar"}]
a[href{$link} target{"_blank"}]
```

## Navigation

The `@nav` syntax sets both `href` and click handler for SPA navigation:

```
a["Go to Counter" @nav(/counter)]
a["Home" @nav(/)]
button["Back" @nav(/)]
```

## Components

### Using Components

Reference other components with `@@`:

```
div.page
  @@Header
  @@MainContent
  @@Footer
```

Components are auto-imported from the `components/` directory.

### Component Example

**Header.ui:**
```
<?

header.navbar
  .navbar-brand
    a["My App" @nav(/)]
  .navbar-menu
    a.navbar-item["Home" @nav(/)]
    a.navbar-item["About" @nav(/about)]
```

**Home.ui:**
```
<?

.container
  @@Header
  main.py-8
    h1["Welcome!"]
    p["This is my app"]
```

## Conditionals

```
? $loading
  p["Loading..."]

? $count > 10
  p["Big number!"]

? $error
  .alert.alert-error[@{$error}]
```

## Loops

Iterate over arrays:

```
$users
  .card
    h3[:name]            // Access item.name
    p[:email]            // Access item.email
```

Full example:
```
$users:[]
~ fetch("/api/users") > $users

<?

.user-list
  $users
    .card
      h3[:name]
      p[:email]
      button["Delete" @click(deleteUser)]
```

## Input Binding

Two-way binding with placeholder:

```
input[$name "Enter name"]
input[$email "Email address"]
textarea[$message "Your message"]
```

## API Actions in Events

### POST and Add to Array

```
button["Add" @click(post:/api/users {name:$name} > $users + clear)]
```

### DELETE and Remove from Array

```
button["Delete" @click(delete:/api/users/:id > $users - :id)]
```

## Complete Example

**Counter.ui:**
```
// Counter component with SlopUI styling

$count:0
$doubled := $count * 2

<?

.container.text-center.py-8
  .card.mx-auto
    h1["Count: @{$count}"]
    p.text-secondary["Doubled: @{$doubled}"]
    .flex.gap-2.justify-center.mt-4
      button.btn.btn-secondary["-" @click($count--)]
      button.btn.btn-outline["Reset" @click($count:0)]
      button.btn.btn-primary["+" @click($count++)]
  .mt-6
    a.btn.btn-ghost["Back to Home" @nav(/)]
```

**UserList.ui:**
```
// User list with API integration

$users:[]
$name:""
$loading:true

~ fetch("/api/users") > $users > $loading:false

<?

.container.py-8
  h1["Users"]

  .flex.gap-2.mb-4
    input.input[$name "Enter name"]
    button.btn.btn-primary["Add" @click(post:/api/users {name:$name} > $users + clear)]

  ? $loading
    p["Loading..."]

  $users
    .card.mb-2
      .flex.justify-between.items-center
        span[:name]
        button.btn.btn-error.btn-sm["Delete" @click(delete:/api/users/:id > $users - :id)]
```

## Next Steps

- Learn [SlopUI](/docs/slopui) for styling components
- Explore [Client Routing](/docs/client-routing) for navigation
- Check [Examples](/docs/examples) for complete apps
