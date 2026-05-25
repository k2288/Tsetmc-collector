export type ErrorCategory =
  | 'provider_timeout'
  | 'provider_unavailable'
  | 'normalization'
  | 'validation'
  | 'deduplication'
  | 'persistence';

export class OperationalError extends Error {
  constructor(
    message: string,
    public readonly category: ErrorCategory,
    public readonly details?: Record<string, unknown>,
    public readonly cause?: unknown
  ) {
    super(message);
  }
}

export class ProviderTimeoutError extends OperationalError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, 'provider_timeout', details, cause);
  }
}

export class ProviderUnavailableError extends OperationalError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, 'provider_unavailable', details, cause);
  }
}

export class NormalizationError extends OperationalError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, 'normalization', details, cause);
  }
}

export class ValidationError extends OperationalError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, 'validation', details, cause);
  }
}

export class DeduplicationError extends OperationalError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, 'deduplication', details, cause);
  }
}

export class PersistenceError extends OperationalError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, 'persistence', details, cause);
  }
}
