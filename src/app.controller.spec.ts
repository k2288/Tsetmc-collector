import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { ProviderHealthService } from './market-data/services/provider-health.service';
import { RedisService } from './storage/redis.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: ProviderHealthService,
          useValue: { getAll: jest.fn().mockReturnValue([]) },
        },
        {
          provide: RedisService,
          useValue: { ping: jest.fn().mockResolvedValue('PONG') },
        },
        {
          provide: getDataSourceToken(),
          useValue: { query: jest.fn().mockResolvedValue([{ '?column?': 1 }]) },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should report service health', async () => {
      await expect(appController.health()).resolves.toMatchObject({
        status: 'ok',
        dependencies: { database: 'fulfilled', redis: 'fulfilled' },
        providers: [],
      });
    });
  });
});
