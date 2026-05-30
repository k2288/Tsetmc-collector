export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'nestdb',
    synchronize: (process.env.TYPEORM_SYNCHRONIZE ?? 'true') === 'true',
    logging: (process.env.TYPEORM_LOGGING ?? 'false') === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'tsetmc-collector:',
  },
  rawData: {
    rootPath: process.env.RAW_DATA_ROOT ?? 'raw-data',
  },
  providers: {
    tsetmc: {
      enabled: (process.env.TSETMC_ENABLED ?? 'true') === 'true',
      baseUrl: process.env.TSETMC_BASE_URL ?? 'https://cdn.tsetmc.com',
      marketWatchPath:
        process.env.TSETMC_MARKET_WATCH_PATH ??
        '/api/ClosingPrice/GetMarketWatch?market=0&industrialGroup=',
      timeoutMs: parseInt(process.env.TSETMC_TIMEOUT_MS ?? '10000', 10),
    },
    brsapi: {
      enabled: (process.env.BRSAPI_ENABLED ?? 'false') === 'true',
      url:
        process.env.BRSAPI_URL ?? 'https://BrsApi.ir/Api/Tsetmc/AllSymbols.php',
      apiKey: process.env.BRSAPI_API_KEY,
      timeoutMs: parseInt(process.env.BRSAPI_TIMEOUT_MS ?? '10000', 10),
    },
  },
  collection: {
    maxRetries: parseInt(process.env.COLLECTOR_MAX_RETRIES ?? '3', 10),
    initialBackoffMs: parseInt(
      process.env.COLLECTOR_INITIAL_BACKOFF_MS ?? '1000',
      10,
    ),
    backoffFactor: parseFloat(process.env.COLLECTOR_BACKOFF_FACTOR ?? '2'),
  },
});
