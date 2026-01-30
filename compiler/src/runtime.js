/**
 * C-slop Runtime
 * Provides built-in functions and utilities for C-slop programs
 */

const express = require('express');
const crypto = require('crypto');

class Database {
  constructor() {
    this.connected = false;
    this.type = null;
    this.config = null;
    this.data = {}; // In-memory storage for now
  }

  connect(type, config) {
    this.type = type;
    this.config = config;
    this.connected = true;
    console.log(`Database connected: ${type}`);
  }

  getTable(tableName) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }

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

function createRuntime(options = {}) {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Database
  const db = createDatabaseProxy(new Database());

  return {
    app,
    db,
    request: createRequest,
    response: createResponse,
    utils
  };
}

module.exports = {
  createRuntime,
  Database,
  utils
};
