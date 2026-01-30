/**
 * C-slop Runtime
 * Provides built-in functions and utilities for C-slop programs
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class Database {
  constructor() {
    this.connected = false;
    this.type = null;
    this.config = null;
    this.data = {}; // In-memory storage fallback
    this.db = null; // Database connection
  }

  connect(type, config) {
    this.type = type;
    this.config = config;
    this.connected = true;

    if (type === 'sqlite') {
      try {
        const Database = require('better-sqlite3');
        this.db = new Database(config);
        console.log(`✓ SQLite database connected: ${config}`);
        this.initSQLite();
      } catch (error) {
        console.warn(`⚠ SQLite not available, using in-memory storage`);
        this.db = null;
      }
    } else if (type === 'memory' || !type) {
      console.log(`✓ Using in-memory database`);
      this.db = null;
    } else {
      console.log(`Database type '${type}' not yet supported, using in-memory`);
      this.db = null;
    }
  }

  initSQLite() {
    // Create tables dynamically as they're used
    // This is a simple implementation - real apps should use migrations
  }

  ensureTable(tableName) {
    if (this.db && this.type === 'sqlite') {
      // Check if table exists, create if not
      const tableExists = this.db.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
      ).get(tableName);

      if (!tableExists) {
        // Create a simple table with id and data columns
        this.db.prepare(`
          CREATE TABLE IF NOT EXISTS ${tableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
      }
    } else if (!this.data[tableName]) {
      this.data[tableName] = [];
    }
  }

  getTable(tableName) {
    this.ensureTable(tableName);

    // SQLite implementation
    if (this.db && this.type === 'sqlite') {
      return {
        findAll: async () => {
          const rows = this.db.prepare(`SELECT * FROM ${tableName}`).all();
          return rows.map(row => ({
            id: row.id,
            ...JSON.parse(row.data),
            created_at: row.created_at
          }));
        },

        findById: async (id) => {
          const row = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
          if (!row) return null;
          return {
            id: row.id,
            ...JSON.parse(row.data),
            created_at: row.created_at
          };
        },

        findWhere: async (filter) => {
          const rows = this.db.prepare(`SELECT * FROM ${tableName}`).all();
          return rows
            .map(row => ({
              id: row.id,
              ...JSON.parse(row.data),
              created_at: row.created_at
            }))
            .filter(item => {
              for (const key in filter) {
                if (item[key] !== filter[key]) return false;
              }
              return true;
            });
        },

        insert: async (data) => {
          const result = this.db.prepare(
            `INSERT INTO ${tableName} (data) VALUES (?)`
          ).run(JSON.stringify(data));

          return {
            id: result.lastInsertRowid,
            ...data
          };
        },

        update: async (id, data) => {
          const existing = await this.getTable(tableName).findById(id);
          if (!existing) return null;

          const updated = { ...existing, ...data };
          delete updated.id;
          delete updated.created_at;

          this.db.prepare(
            `UPDATE ${tableName} SET data = ? WHERE id = ?`
          ).run(JSON.stringify(updated), id);

          return { id, ...updated };
        },

        delete: async (id) => {
          const existing = await this.getTable(tableName).findById(id);
          if (!existing) return null;

          this.db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
          return existing;
        }
      };
    }

    // In-memory fallback
    return {
      findAll: async () => {
        return this.data[tableName];
      },

      findById: async (id) => {
        return this.data[tableName].find(item => item.id === id || item.id === parseInt(id));
      },

      findWhere: async (filter) => {
        return this.data[tableName].filter(item => {
          for (const key in filter) {
            if (item[key] !== filter[key]) return false;
          }
          return true;
        });
      },

      insert: async (data) => {
        const id = this.data[tableName].length + 1;
        const record = { id, ...data };
        this.data[tableName].push(record);
        return record;
      },

      update: async (id, data) => {
        const index = this.data[tableName].findIndex(item => item.id === id);
        if (index !== -1) {
          this.data[tableName][index] = { ...this.data[tableName][index], ...data };
          return this.data[tableName][index];
        }
        return null;
      },

      delete: async (id) => {
        const index = this.data[tableName].findIndex(item => item.id === id);
        if (index !== -1) {
          return this.data[tableName].splice(index, 1)[0];
        }
        return null;
      }
    };
  }
}

// Create proxy to automatically get tables
const createDatabaseProxy = (db) => {
  return new Proxy(db, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      return target.getTable(prop);
    }
  });
};

// Request helper - maps $ to req properties
function createRequest(req) {
  return {
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
    method: req.method,
    path: req.path,
    cookies: req.cookies,
    ...req.params  // Allow $.id syntax
  };
}

// Response helper - maps # to res methods
function createResponse(res) {
  return {
    json: (data) => res.json(data),
    html: (content) => res.send(content),
    text: (text) => res.send(text),
    status: (code) => res.status(code),
    redirect: (url) => res.redirect(url),
    send: (data) => res.send(data)
  };
}

// Utility functions
const utils = {
  uuid: () => {
    return crypto.randomUUID();
  },

  hash: (str) => {
    return crypto.createHash('sha256').update(str).digest('hex');
  },

  now: () => {
    return Date.now();
  },

  jwt: (data) => {
    // Simple JWT implementation (not secure, just for demo)
    const payload = JSON.stringify(data);
    const signature = crypto.createHash('sha256').update(payload).digest('hex');
    return Buffer.from(`${payload}.${signature}`).toString('base64');
  },

  jwtVerify: (token) => {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [payload] = decoded.split('.');
      return JSON.parse(payload);
    } catch {
      return null;
    }
  },

  sleep: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

function loadConfig(basePath) {
  // Look for slop.json in the project directory
  const configPaths = [
    path.join(basePath, 'slop.json'),
    path.join(process.cwd(), 'slop.json'),
    path.join(__dirname, '..', 'slop.json')
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(`✓ Loaded config from: ${configPath}`);
        return config;
      } catch (error) {
        console.warn(`⚠ Error loading config from ${configPath}:`, error.message);
      }
    }
  }

  return null;
}

function createRuntime(options = {}) {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Database
  const database = new Database();

  // Load config and auto-connect database
  const config = loadConfig(options.basePath || process.cwd());
  if (config && config.database) {
    database.connect(config.database.type, config.database.connection);
  }

  const db = createDatabaseProxy(database);

  return {
    app,
    db,
    request: createRequest,
    response: createResponse,
    utils,
    config
  };
}

module.exports = {
  createRuntime,
  Database,
  utils
};
