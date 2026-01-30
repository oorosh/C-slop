# Database Configuration Guide

## Quick Answer

**C-slop now uses SQLite by default with a `slop.json` config file!**

## Setup

### 1. Create `slop.json` in your project

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

### 2. Run your app

```bash
cslop app.slop
```

You'll see:
```
✓ Loaded config from: ./slop.json
✓ SQLite database connected: ./dev.db
Server running at http://localhost:3000
```

### 3. Data persists between restarts! 🎉

```bash
# Create data
curl -X POST http://localhost:3000/users -d '{"name":"Alice"}'

# Restart server (Ctrl+C, then cslop app.slop)

# Data is still there!
curl http://localhost:3000/users
```

## Database Options

### SQLite (Recommended)
```json
{
  "database": {
    "type": "sqlite",
    "connection": "./myapp.db"
  }
}
```
- ✅ Persistent storage
- ✅ File-based (no server)
- ✅ Perfect for development
- ✅ Works in production

### In-Memory (Testing)
```json
{
  "database": {
    "type": "memory"
  }
}
```
- ⚠️ Data lost on restart
- ✅ Very fast
- ✅ Good for tests

### No Config (Default)
If no `slop.json` exists, C-slop uses in-memory storage.

## File Location

C-slop looks for `slop.json` in:
1. Your app directory
2. Current working directory
3. Compiler directory

## Example App with Database

`app.slop`:
```cslop
*/ > #json({message: "Hello with persistent DB!"})

*/users > @users > #json

*/users/:id > @users[$.id] > #json

*/users + @users!$.body > #json

*/users/:id ~ @users[$.id]!$.body > #json

*/users/:id - @users[$.id]!- > #204
```

`slop.json`:
```json
{
  "database": {
    "type": "sqlite",
    "connection": "./app.db"
  }
}
```

Run:
```bash
cslop app.slop
```

## How It Works

1. **Auto-config**: Runtime loads `slop.json` on startup
2. **Auto-tables**: Tables created when first accessed
3. **JSON storage**: Data stored as JSON (schema-less!)
4. **Auto-fields**: Get `id` and `created_at` automatically

## Database Structure

Tables look like this in SQLite:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,           -- Your JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

But you use them like:
```cslop
@users!{name:"Alice", email:"alice@test.com"}
```

And get:
```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@test.com",
  "created_at": "2024-01-30 13:00:00"
}
```

## Viewing Your Data

```bash
# Install sqlite3 if needed
brew install sqlite3  # macOS

# View data
sqlite3 dev.db "SELECT * FROM users"

# Or use a GUI like DB Browser for SQLite
```

## Multiple Environments

**Development** (`slop.development.json`):
```json
{
  "database": {
    "type": "sqlite",
    "connection": "./dev.db"
  }
}
```

**Production** (`slop.production.json`):
```json
{
  "database": {
    "type": "sqlite",
    "connection": "/var/data/prod.db"
  }
}
```

Symlink the active one:
```bash
ln -sf slop.development.json slop.json
```

## Coming Soon

- PostgreSQL support
- MySQL support
- MongoDB support
- Database migrations
- Relationships/joins
- Advanced queries

## Troubleshooting

**"SQLite not available"**:
```bash
cd compiler
npm install better-sqlite3
```

**Data not persisting?**:
Check that `slop.json` has `type: "sqlite"`, not `"memory"`.

**Table not found?**:
Tables are created automatically. Just use `@tablename` and it'll be created.

## Tips

1. **Add to .gitignore**:
   ```
   *.db
   ```

2. **Backup your database**:
   ```bash
   cp app.db app.db.backup
   ```

3. **Different databases per environment**:
   - dev.db for development
   - test.db for testing
   - prod.db for production

## Full Documentation

See `compiler/DATABASE.md` for complete details!
