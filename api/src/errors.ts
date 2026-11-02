export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DuplicatePaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicatePaymentError';
  }
}
