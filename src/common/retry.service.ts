import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  constructor(private readonly configService: ConfigService) {}

  async execute<T>(
    operationName: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const maxRetries =
      this.configService.get<number>('collection.maxRetries') ?? 3;
    const initialBackoffMs =
      this.configService.get<number>('collection.initialBackoffMs') ?? 1000;
    const backoffFactor =
      this.configService.get<number>('collection.backoffFactor') ?? 2;

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          break;
        }

        const delayMs = Math.round(
          initialBackoffMs * Math.pow(backoffFactor, attempt),
        );
        this.logger.warn(
          JSON.stringify({
            event: 'retry_scheduled',
            operationName,
            attempt: attempt + 1,
            nextAttempt: attempt + 2,
            delayMs,
            error: error instanceof Error ? error.message : String(error),
          }),
        );
        await this.sleep(delayMs);
      } finally {
        attempt += 1;
      }
    }

    throw lastError;
  }

  private sleep(delayMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
