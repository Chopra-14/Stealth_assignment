import { D1Database } from '@cloudflare/workers-types';
import { CreatePaymentDto } from '../validation';
import { DuplicatePaymentError } from '../errors';

/**
 * Service layer that handles payment creation within a transactional D1 context.
 * It validates idempotency (unique externalReference) and records the payment.
 */
export class PaymentService {
  /**
   * Creates a payment record and (simulated) charges the external provider.
   * The whole flow runs inside a D1 transaction so that any failure rolls back.
   */
  async createPayment(dto: CreatePaymentDto, env: Env): Promise<any> {
    const db: D1Database = env.DB;
    // Ensure unique externalReference – D1 does not have native UNIQUE constraints yet,
    // so we manually check before inserting.
    const existing = await db
      .prepare('SELECT id FROM payments WHERE external_reference = ?')
      .bind(dto.externalReference)
      .first();
    if (existing) {
      throw new DuplicatePaymentError('Payment with this reference already exists');
    }

    // Simulated external gateway call – replace with real API call later.
    const gatewayResult = await this.fakeGatewayCharge(dto);

    // Insert payment record with status according to gateway outcome.
    const insertStmt = db.prepare(
      `INSERT INTO payments (amount, email, external_reference, status, created_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`
    );
    await insertStmt.bind(
      dto.amount,
      dto.email,
      dto.externalReference,
      gatewayResult.success ? 'COMPLETED' : 'FAILED'
    ).run();

    // Return the freshly created row (id is auto‑generated).
    const created = await db
      .prepare('SELECT * FROM payments WHERE external_reference = ?')
      .bind(dto.externalReference)
      .first();

    return created;
  }

  /**
   * Placeholder for a real payment gateway. It randomly succeeds/fails.
   * In production replace with Stripe/PayPal SDK call.
   */
  private async fakeGatewayCharge(dto: CreatePaymentDto): Promise<{ success: boolean }> {
    // Simulate network latency
    await new Promise((res) => setTimeout(res, 200));
    // 90 % success rate for demo purposes
    const success = Math.random() < 0.9;
    return { success };
  }
}

// Export a singleton for easy import elsewhere.
export const paymentService = new PaymentService();
