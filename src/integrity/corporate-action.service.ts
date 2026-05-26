import { Injectable } from '@nestjs/common';
@Injectable()
export class CorporateActionService {
  adjustmentVersion = 'corp-action-v1';
  applyAdjustment(price: number, factor: number): number { return Number((price * factor).toFixed(6)); }
  buildChainIntegrity(factors: number[]): boolean { return factors.every((x) => Number.isFinite(x) && x > 0); }
}
