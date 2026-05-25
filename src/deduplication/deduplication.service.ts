import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DeduplicationService {
  buildIngestionHash(symbol: string, timestampUtc: Date, payload: unknown): string {
    return createHash('sha256').update(`${symbol}|${timestampUtc.toISOString()}|${JSON.stringify(payload)}`).digest('hex');
  }
}
