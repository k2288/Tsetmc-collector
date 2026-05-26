import { Injectable } from '@nestjs/common';

type ProviderHealth = {
  provider: string;
  success: boolean;
  latencyMs: number;
  lastRunAtUtc: string;
  error?: string;
};

@Injectable()
export class HealthService {
  private readonly health = new Map<string, ProviderHealth>();

  update(status: ProviderHealth): void {
    this.health.set(status.provider, status);
  }

  getAll(): ProviderHealth[] {
    return [...this.health.values()];
  }
}
