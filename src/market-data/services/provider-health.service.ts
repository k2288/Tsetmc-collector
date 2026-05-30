import { Injectable } from '@nestjs/common';

export interface ProviderHealthState {
  providerName: string;
  healthy: boolean;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  consecutiveFailures: number;
  lastError?: string;
}

@Injectable()
export class ProviderHealthService {
  private readonly states = new Map<string, ProviderHealthState>();

  markSuccess(providerName: string): void {
    const current = this.get(providerName);
    this.states.set(providerName, {
      ...current,
      healthy: true,
      lastSuccessAt: new Date().toISOString(),
      consecutiveFailures: 0,
      lastError: undefined,
    });
  }

  markFailure(providerName: string, error: unknown): void {
    const current = this.get(providerName);
    this.states.set(providerName, {
      ...current,
      healthy: false,
      lastFailureAt: new Date().toISOString(),
      consecutiveFailures: current.consecutiveFailures + 1,
      lastError: error instanceof Error ? error.message : String(error),
    });
  }

  get(providerName: string): ProviderHealthState {
    return (
      this.states.get(providerName) ?? {
        providerName,
        healthy: false,
        consecutiveFailures: 0,
      }
    );
  }

  getAll(): ProviderHealthState[] {
    return [...this.states.values()];
  }
}
