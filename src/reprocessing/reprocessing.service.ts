import { Injectable } from '@nestjs/common';
import { NormalizerService } from '../normalizer/normalizer.service';
@Injectable()
export class ReprocessingService {
  constructor(private readonly normalizer: NormalizerService) {}
  rebuildMarket(rawPayload: unknown, providerVersion: string) { return this.normalizer.normalizeMarket(rawPayload, providerVersion); }
}
