import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  async withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 3, baseDelayMs = 500): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          break;
        }

        const delay = baseDelayMs * 2 ** attempt;
        this.logger.warn(`${label} failed on attempt ${attempt + 1}; retrying in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt += 1;
      }
    }

    throw lastError;
  }
}
