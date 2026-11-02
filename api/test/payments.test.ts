import { describe, expect, test } from 'vitest';
import { Hono } from 'hono';
import { paymentRouter } from '../src/routes/payments';
import { D1Database } from '@cloudflare/workers-types';

// Tiny in‑memory D1 mock (same as used in the earlier example)
function mockD1(): D1Database {
  const rows: Record<string, any> = {};
  let id = 1;
  return {
    prepare: (sql: string) => {
      let boundArgs: any[] = [];
      const stmt = {
        bind: (...args: any[]) => {
          boundArgs = args;
          return stmt;
        },
        first: async () => {
          if (sql.includes('SELECT id FROM payments')) {
            const ref = boundArgs[0];
            const existing = Object.values(rows).find(r => r.external_reference === ref);
            return existing ? { id: existing.id } : null;
          }
          if (sql.includes('SELECT * FROM payments')) {
            const ref = boundArgs[0];
            const existing = Object.values(rows).find(r => r.external_reference === ref);
            return existing || null;
          }
          return null;
        },
        run: async () => {
          const [amount, email, externalReference, status] = boundArgs;
          const newRow = {
            id: id++,
            amount,
            email,
            external_reference: externalReference,
            status,
            created_at: new Date().toISOString(),
          };
          rows[newRow.id] = newRow;
          return { success: true };
        },
        all: async () => ({ results: [] }),
      };
      return stmt;
    },
  } as unknown as D1Database;
}

function buildApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/api', paymentRouter);
  return app;
}

describe('Payment API', () => {
  test('creates a payment successfully', async () => {
    const app = buildApp();
    const payload = { amount: 12.5, email: 'alice@example.com', externalReference: 'ref-001' };
    const res = await app.fetch(
      new Request('http://localhost/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      { DB: mockD1() } as any,
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject({
      amount: payload.amount,
      email: payload.email,
      external_reference: payload.externalReference,
      status: expect.stringMatching(/COMPLETED|FAILED/),
    });
  });

  test('rejects duplicate externalReference', async () => {
    const app = buildApp();
    const db = mockD1();
    // first request – creates the row
    await app.fetch(
      new Request('http://localhost/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10, email: 'bob@example.com', externalReference: 'dup-001' }),
      }),
      { DB: db } as any,
    );
    // second request – should get 409
    const dupRes = await app.fetch(
      new Request('http://localhost/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10, email: 'bob@example.com', externalReference: 'dup-001' }),
      }),
      { DB: db } as any,
    );
    expect(dupRes.status).toBe(409);
    const err = await dupRes.json();
    expect(err).toHaveProperty('error', 'Payment with this reference already exists');
  });

  test('fails validation for bad payload', async () => {
    const app = buildApp();
    const bad = { amount: -5, email: 'not-an-email', externalReference: '' };
    const res = await app.fetch(
      new Request('http://localhost/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bad),
      }),
      { DB: mockD1() } as any,
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty('error', 'Invalid payload');
    expect(json).toHaveProperty('details');
  });
});
