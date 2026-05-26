export enum ValidityState { VALID = 'VALID', WARNING = 'WARNING', INVALID = 'INVALID' }
export enum LifecycleState { ACTIVE = 'ACTIVE', HALTED = 'HALTED', SUSPENDED = 'SUSPENDED', REOPENED = 'REOPENED', DELISTED = 'DELISTED' }
export interface ValidationResult { validityState: ValidityState; qualityFlags: string[]; validationReason?: string; stalenessScore: number; providerLatencyMs: number; qualityScore: number; }
export interface CanonicalTimelinePoint { instrumentId: string; intervalStartUtc: Date; intervalEndUtc: Date; hasData: boolean; timelineHash: string; marker: 'OBSERVED' | 'MISSING'; }
