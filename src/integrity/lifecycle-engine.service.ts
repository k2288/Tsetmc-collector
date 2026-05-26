import { Injectable } from '@nestjs/common';
import { LifecycleState } from '../models/market-integrity.models';
@Injectable()
export class LifecycleEngineService {
  private readonly validTransitions: Record<LifecycleState, LifecycleState[]> = { ACTIVE: ['HALTED', 'SUSPENDED', 'DELISTED'], HALTED: ['ACTIVE', 'REOPENED', 'SUSPENDED', 'DELISTED'], SUSPENDED: ['REOPENED', 'DELISTED'], REOPENED: ['ACTIVE', 'HALTED', 'SUSPENDED'], DELISTED: [] };
  canTransition(from: LifecycleState, to: LifecycleState) { return this.validTransitions[from].includes(to); }
}
