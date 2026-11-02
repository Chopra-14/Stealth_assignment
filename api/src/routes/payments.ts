import { Hono } from 'hono';
import { Context } from 'hono';
import { CreatePaymentSchema, CreatePaymentDto } from '../validation';
import { paymentService } from '../services/paymentService';
import { ValidationError, DuplicatePaymentError } from '../errors';

export const paymentRouter = new Hono<{ Bindings: Env }>()
  .post('/payments', async (c: Context) => {
    // Parse & validate JSON body
    const json = await c.req.json();
    const parseResult = CreatePaymentSchema.safeParse(json);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return c.json({ error: 'Invalid payload', details }, 400);
    }
    const payload: CreatePaymentDto = parseResult.data;
    try {
      const result = await paymentService.createPayment(payload, c.env);
      return c.json(result, 201);
    } catch (err: any) {
      if (err instanceof DuplicatePaymentError) {
        return c.json({ error: err.message }, 409);
      }
      console.error(err);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });
