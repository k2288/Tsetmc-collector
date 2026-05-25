export type CircuitState = 'closed' | 'open' | 'half_open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private openedAt = 0;

  constructor(private readonly threshold: number, private readonly cooldownMs: number) {}

  canExecute(now = Date.now()): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open' && now - this.openedAt >= this.cooldownMs) {
      this.state = 'half_open';
      return true;
    }
    return this.state === 'half_open';
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(now = Date.now()) {
    this.failures += 1;
    if (this.failures >= this.threshold || this.state === 'half_open') {
      this.state = 'open';
      this.openedAt = now;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
