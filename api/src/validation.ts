// validation.ts
// Zod schemas for API payload validation

import { z } from 'zod';

export const CreatePaymentSchema = z.object({
  amount: z.number().positive({ message: 'Amount must be greater than zero' }),
  email: z.string().email({ message: 'Invalid email address' }),
  externalReference: z.string().min(1, { message: 'Reference is required' }),
});

export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>;
