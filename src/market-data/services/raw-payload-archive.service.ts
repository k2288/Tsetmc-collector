import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ArchivedPayload {
  archivePath: string;
  contentHash: string;
  serializedPayload: string;
}

@Injectable()
export class RawPayloadArchiveService {
  constructor(private readonly configService: ConfigService) {}

  async archive(
    providerName: string,
    capturedAt: Date,
    payload: unknown,
  ): Promise<ArchivedPayload> {
    const rootPath =
      this.configService.get<string>('rawData.rootPath') ?? 'raw-data';
    const day = capturedAt.toISOString().slice(0, 10);
    const time = capturedAt.toISOString().slice(11, 19).replace(/:/g, '-');
    const providerPath = join(rootPath, providerName, day);
    await mkdir(providerPath, { recursive: true });

    const serializedPayload = JSON.stringify(payload, null, 2);
    const contentHash = createHash('sha256')
      .update(serializedPayload)
      .digest('hex');
    const archivePath = join(
      providerPath,
      `${time}-${contentHash.slice(0, 12)}.json`,
    );

    await writeFile(archivePath, serializedPayload, { flag: 'wx' }).catch(
      async (error: NodeJS.ErrnoException) => {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      },
    );

    return { archivePath, contentHash, serializedPayload };
  }
}
