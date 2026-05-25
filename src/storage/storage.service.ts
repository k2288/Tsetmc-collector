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

  async quarantineFailure(rawPayloadId: string, providerName: string, stage: string, reason: string, payload: unknown, err?: unknown) {
    const stackTrace = err instanceof Error ? err.stack : String(err ?? '');
    await this.prisma.deadLetterPayload.create({
      data: {
        rawPayloadId,
        providerName,
        failureStage: stage,
        failureReason: reason,
        payloadJson: payload as Prisma.InputJsonValue,
        stackTrace
      }
    });
    await this.prisma.rawApiPayload.update({ where: { id: rawPayloadId }, data: { processingStatus: ProcessingStatus.FAILED } });
  }
}
