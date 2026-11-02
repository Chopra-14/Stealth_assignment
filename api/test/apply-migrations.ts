// No‑op migration helper for the in‑memory D1 mock used in unit tests.
// The original Cloudflare test helper is not required in this environment.
// This file is imported by Vitest's setupFiles array but performs no actions.
export async function applyMigrations(): Promise<void> {
  // Intentionally empty.
}

