// src/env.ts
// TypeScript definitions for Cloudflare Workers bindings used in this project.

export interface Env {
  // D1 database binding defined in wrangler.jsonc as "DB"
  DB: D1Database;
}
