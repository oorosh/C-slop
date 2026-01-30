# Database Configuration

C-slop supports multiple database backends through a simple config file.

## Configuration File: `slop.json`

Create a `slop.json` file in your project directory:

```json
{
  "database": {
    "type": "sqlite",
    "connection": "./dev.db"
  },
  "server": {
    "port": 3000,
    "host": "localhost"
  }
}
```

## Supported Databases

### SQLite (Recommended for Development)

```json
{
  "database": {
    "type": "sqlite",
    "connection": "./dev.db"
  }
}
```

- **Persistent** - Data survives server restarts
- **File-based** - No server setup needed
- **Fast** - Great for development and small apps

### In-Memory (Default)

```json
{
  "database": {
    "type": "memory"
  }
}
```

- **Non-persistent** - Data lost on restart
- **Fast** - No disk I/O
- **Good for testing**

If no `slop.json` is found, C-slop uses in-memory storage by default.

## Auto-Configuration

The runtime automatically:
1. Looks for `slop.json` in the current directory
2. Connects to the database on startup
3. Creates tables as needed (schema-less!)

You'll see:
```
✓ Loaded config from: ./slop.json
✓ SQLite database connected: ./dev.db
```

## Usage Example

### 1. Create `slop.json`

```json
{
  "database": {
    "type": "sqlite",
    "connection": "./myapp.db"
  }
}
```

### 2. Create your app `app.slop`

```cslop
*/ > #json({message: "Hello with persistent DB!"})

*/users > @users > #json

*/users + @users!$.body > #json
```

### 3. Run it

```bash
cslop app.slop
```

### 4. Test persistence

```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com"}'

# Restart the server (Ctrl+C, then cslop app.slop again)

# Data is still there!
curl http://localhost:3000/users
```

## Database Operations

### Select

```cslop
@users              # Get all
@users[123]         # Get by ID
@users[$.id]        # Get by request param
@users?{active:true} # Filter
```

### Insert

```cslop
@users!{name:"Alice", email:"alice@test.com"}
@users!$.body       # From request body
```

### Update

```cslop
@users[123]!{name:"Updated"}
@users[$.id]!$.body  # Update from request
```

### Delete

```cslop
@users[123]!-       # Delete by ID
@users[$.id]!-      # Delete by request param
```

## Table Schema

C-slop uses a **schema-less** approach:
- Tables are created automatically when first used
- Each record is stored as JSON
- You get `id` and `created_at` automatically

SQLite structure:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,           -- Your JSON data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

When you query, you get:
```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@test.com",
  "created_at": "2024-01-30 12:00:00"
}
```

## Multiple Environments

Use different config files:

```bash
# Development
cp slop.json slop.development.json

# Production
cp slop.json slop.production.json
```

Then link to the right one:
```bash
ln -sf slop.development.json slop.json
```

## Coming Soon

- **PostgreSQL** support
- **MySQL** support
- **MongoDB** support
- Schema migrations
- Relationships and joins
- Query builders

## Tips

1. **Gitignore your database file**:
   ```gitignore
   *.db
   slop.json  # If it contains secrets
   ```

2. **Use SQLite for development**, plan for PostgreSQL in production

3. **Back up your database**:
   ```bash
   cp myapp.db myapp.db.backup
   ```

4. **View your data** with any SQLite viewer:
   ```bash
   sqlite3 dev.db "SELECT * FROM users"
   ```

## Example Projects

See `compiler/test/with-db.slop` for a complete example with persistent storage!
