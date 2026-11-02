// Simplified Vitest configuration for pure Node testing without Cloudflare miniflare.
// This avoids the need for the cloudflareTest plugin and the missing 'cloudflare:test-internal' module.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use the same setup file to apply D1 migrations if needed (can be a no‑op for now).
    // Keeping the file reference maintains compatibility with existing code.
    // If the setup file imports cloudflare utilities, it will be ignored in this plain Node context.
    setupFiles: ['./test/apply-migrations.ts'],
    // Ensure globals are available (e.g., describe, test) and environment is node.
    globals: true,
    environment: 'node',
  },
});
