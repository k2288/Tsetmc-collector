import { Injectable } from '@nestjs/common';
import { Prisma, ProcessingStatus } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class StorageService {
  constructor(private readonly prisma: PrismaService) {}

  async archiveRawPayload(providerName: string, endpoint: string, payload: unknown, hash: string, statusCode = 200) {
    return this.prisma.rawApiPayload.create({
      data: {
        providerName,
        endpoint,
        fetchedAtUtc: new Date(),
        payloadJson: payload as Prisma.InputJsonValue,
        payloadHashSha256: hash,
        statusCode,
        processingStatus: ProcessingStatus.RECEIVED
      }
    });
  }
}
