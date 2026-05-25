export default () => ({
  port: Number(process.env.PORT ?? 3000),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  ingestionCron: process.env.INGESTION_CRON ?? '*/10 * * * * *',
  providerTimeoutMs: Number(process.env.PROVIDER_TIMEOUT_MS ?? 5000),
  providerRetryAttempts: Number(process.env.PROVIDER_RETRY_ATTEMPTS ?? 3),
  providerRetryBaseDelayMs: Number(process.env.PROVIDER_RETRY_BASE_DELAY_MS ?? 200),
  pipelineVersion: process.env.PIPELINE_VERSION ?? 'phase1-v1',
  schemaVersion: process.env.SCHEMA_VERSION ?? '1.0.0',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  ingestionQueueMaxSize: Number(process.env.INGESTION_QUEUE_MAX_SIZE ?? 2000)
});
