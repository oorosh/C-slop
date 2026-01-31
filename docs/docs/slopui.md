---
sidebar_position: 6
---

# SlopUI

SlopUI is C-slop's built-in CSS component library, similar to DaisyUI or Tailwind. It's included automatically in all projects.

## Theme Support

### Dark/Light Mode

SlopUI supports automatic dark and light themes:

```
button["Toggle Theme" @click(toggleTheme)]
```

The `toggleTheme()` function is globally available and persists the theme choice to localStorage.

### Theme Configuration

Configure theme colors in `slop.json`:

```json
{
  "theme": {
    "light": {
      "primary": "#3b82f6",
      "success": "#22c55e",
      "warning": "#f59e0b",
      "error": "#ef4444"
    },
    "dark": {
      "primary": "#60a5fa",
      "success": "#4ade80",
      "warning": "#fbbf24",
      "error": "#f87171"
    }
  }
}
```

## Buttons

### Button Variants

```
button.btn["Default"]
button.btn.btn-primary["Primary"]
button.btn.btn-secondary["Secondary"]
button.btn.btn-success["Success"]
button.btn.btn-warning["Warning"]
button.btn.btn-error["Error"]
button.btn.btn-ghost["Ghost"]
button.btn.btn-outline["Outline"]
```

### Button Sizes

```
button.btn.btn-sm["Small"]
button.btn["Normal"]
button.btn.btn-lg["Large"]
```

### Button States

```
button.btn.btn-primary[disabled{"true"}]["Disabled"]
```

### Link Buttons

Links styled as buttons work seamlessly:

```
a.btn.btn-primary["Go to Page" @nav(/page)]
```

## Cards

```
.card
  .card-header
    h3.card-title["Card Title"]
  .card-body
    p["Card content goes here."]
  .card-footer
    button.btn.btn-primary["Action"]
```

Simple card:

```
.card
  h3.card-title["Title"]
  p["Content"]
```

## Forms

### Text Inputs

```
input.input["Placeholder text"]
input.input.input-error["With error state"]
```

### Textarea

```
textarea.textarea["Enter your message"]
```

### Select

```
select.select
  option["Option 1"]
  option["Option 2"]
  option["Option 3"]
```

### Checkbox & Radio

```
input.checkbox[type{"checkbox"}]
input.radio[type{"radio"}]
```

### Toggle Switch

```
input.toggle[type{"checkbox"}]
```

### Form Groups

```
.form-group
  label["Email"]
  input.input[type{"email"} placeholder{"you@example.com"}]

.form-group
  label["Password"]
  input.input[type{"password"} placeholder{"********"}]
```

## Alerts

```
.alert.alert-info["This is an info message"]
.alert.alert-success["Operation completed successfully!"]
.alert.alert-warning["Please review your input"]
.alert.alert-error["An error occurred"]
```

## Badges

```
span.badge["Default"]
span.badge.badge-primary["Primary"]
span.badge.badge-secondary["Secondary"]
span.badge.badge-success["Success"]
span.badge.badge-warning["Warning"]
span.badge.badge-error["Error"]
```

## Tables

```
table.table
  thead
    tr
      th["Name"]
      th["Email"]
      th["Actions"]
  tbody
    tr
      td["John Doe"]
      td["john@example.com"]
      td
        button.btn.btn-sm.btn-error["Delete"]
```

## Navigation

### Navbar

```
nav.navbar
  .navbar-brand
    a["My App" @nav(/)]
  .navbar-menu
    a.navbar-item["Home" @nav(/)]
    a.navbar-item["About" @nav(/about)]
    a.navbar-item["Contact" @nav(/contact)]
```

### Tabs 🚧 WIP

*Note: CSS only - JavaScript tab switching not yet implemented*

```
.tabs
  button.tab.tab-active["Tab 1"]
  button.tab["Tab 2"]
  button.tab["Tab 3"]
```

### Breadcrumbs

```
.breadcrumb
  a["Home" @nav(/)]
  span["/"]
  a["Products" @nav(/products)]
  span["/"]
  span["Current Page"]
```

## Progress

```
.progress
  .progress-bar[style{"width: 75%"}]
```

## Avatars

```
.avatar
  img[src{$userAvatar} alt{"User"}]

.avatar.avatar-sm
  img[src{$userAvatar}]

.avatar.avatar-lg
  img[src{$userAvatar}]
```

## Modal 🚧 WIP

*Note: CSS only - JavaScript toggle not yet implemented*

```
.modal
  .modal-box
    h3["Modal Title"]
    p["Modal content goes here"]
    .modal-actions
      button.btn["Cancel"]
      button.btn.btn-primary["Confirm"]
```

## Dropdown 🚧 WIP

*Note: CSS only - JavaScript toggle not yet implemented*

```
.dropdown
  button.btn["Menu"]
  .dropdown-content
    a["Option 1"]
    a["Option 2"]
    a["Option 3"]
```

## Tooltips 🚧 WIP

*Note: CSS only - JavaScript positioning not yet implemented*

```
.tooltip[data-tip{"This is a tooltip"}]
  button.btn["Hover me"]
```

## Layout Utilities

### Containers

```
.container              # Max 1200px, centered
.container-sm           # Max 640px
.container-md           # Max 768px
.container-lg           # Max 1024px
.container-xl           # Max 1280px
```

### Flexbox

```
.flex                   # display: flex
.flex-col               # flex-direction: column
.flex-row               # flex-direction: row
.flex-wrap              # flex-wrap: wrap
.items-center           # align-items: center
.items-start            # align-items: flex-start
.items-end              # align-items: flex-end
.justify-center         # justify-content: center
.justify-between        # justify-content: space-between
.justify-around         # justify-content: space-around
.justify-end            # justify-content: flex-end
```

### Gap

```
.gap-1    # 0.25rem
.gap-2    # 0.5rem
.gap-3    # 0.75rem
.gap-4    # 1rem
.gap-6    # 1.5rem
.gap-8    # 2rem
```

### Grid

```
.grid                   # display: grid
.grid-cols-1            # 1 column
.grid-cols-2            # 2 columns
.grid-cols-3            # 3 columns
.grid-cols-4            # 4 columns
```

## Spacing Utilities

### Padding

```
.p-1 .p-2 .p-3 .p-4 .p-6 .p-8       # All sides
.px-1 .px-2 .px-3 .px-4 .px-6       # Left & right
.py-1 .py-2 .py-3 .py-4 .py-6       # Top & bottom
```

### Margin

```
.m-1 .m-2 .m-3 .m-4 .m-6 .m-8       # All sides
.mx-auto                             # Center horizontally
.my-4 .my-6 .my-8                    # Top & bottom
.mt-2 .mt-4 .mt-6 .mt-8              # Top only
.mb-2 .mb-4 .mb-6 .mb-8              # Bottom only
```

## Text Utilities

### Alignment

```
.text-center
.text-left
.text-right
```

### Size

```
.text-xs     # 0.75rem
.text-sm     # 0.875rem
.text-base   # 1rem
.text-lg     # 1.125rem
.text-xl     # 1.25rem
.text-2xl    # 1.5rem
.text-3xl    # 1.875rem
```

### Weight

```
.font-normal    # 400
.font-medium    # 500
.font-semibold  # 600
.font-bold      # 700
```

### Color

```
.text-primary
.text-secondary
.text-tertiary
.text-success
.text-warning
.text-error
```

## Display Utilities

```
.hidden           # display: none
.block            # display: block
.inline           # display: inline
.inline-block     # display: inline-block
```

## Position Utilities

```
.relative
.absolute
.fixed
.sticky
```

## Width/Height

```
.w-full           # width: 100%
.h-full           # height: 100%
.min-h-screen     # min-height: 100vh
```

## Overflow

```
.overflow-hidden
.overflow-auto
.overflow-x-auto
.overflow-y-auto
```

## CSS Variables

SlopUI uses CSS custom properties that you can override:

```css
:root {
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --bg: #ffffff;
  --bg-secondary: #f9fafb;
  --text: #111827;
  --text-secondary: #4b5563;
  --border: #e5e7eb;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
}
```

## Complete Example

```
<?

.container.py-8
  .card.mb-6
    h2.card-title["Dashboard"]
    .grid.grid-cols-3.gap-4
      .card.text-center.p-4
        h3.text-2xl.font-bold["125"]
        p.text-secondary["Users"]
      .card.text-center.p-4
        h3.text-2xl.font-bold["$4,250"]
        p.text-secondary["Revenue"]
      .card.text-center.p-4
        h3.text-2xl.font-bold["98%"]
        p.text-secondary["Uptime"]

  .flex.justify-between.items-center.mb-4
    h2["Recent Users"]
    button.btn.btn-primary["Add User"]

  table.table
    thead
      tr
        th["Name"]
        th["Email"]
        th["Status"]
        th["Actions"]
    tbody
      tr
        td["John Doe"]
        td["john@example.com"]
        td
          span.badge.badge-success["Active"]
        td
          button.btn.btn-sm.btn-ghost["Edit"]
          button.btn.btn-sm.btn-error["Delete"]
```

## Next Steps

- Learn [Frontend Components](/docs/components) for reactive UI
- Explore [Client Routing](/docs/client-routing) for navigation
- Check [Examples](/docs/examples) for complete apps
