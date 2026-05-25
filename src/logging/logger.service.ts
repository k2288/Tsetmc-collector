import { Injectable, LoggerService } from '@nestjs/common';
import pino, { Logger } from 'pino';

@Injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
  }

  log(message: string, ...optionalParams: unknown[]): void { this.logger.info({ optionalParams }, message); }
  error(message: string, ...optionalParams: unknown[]): void { this.logger.error({ optionalParams }, message); }
  warn(message: string, ...optionalParams: unknown[]): void { this.logger.warn({ optionalParams }, message); }
  debug(message: string, ...optionalParams: unknown[]): void { this.logger.debug({ optionalParams }, message); }
  verbose(message: string, ...optionalParams: unknown[]): void { this.logger.trace({ optionalParams }, message); }
  child(bindings: Record<string, unknown>): Logger { return this.logger.child(bindings); }
}
