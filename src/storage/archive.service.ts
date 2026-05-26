import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class ArchiveService {
  async archive(provider: string, payload: Record<string, unknown>, timestamp: Date): Promise<string> {
    const rootDir = process.env.RAW_DATA_DIR || './raw-data';
    const day = timestamp.toISOString().slice(0, 10);
    const time = timestamp.toISOString().slice(11, 19).replace(/:/g, '-');
    const dir = join(rootDir, provider, day);

    await mkdir(dir, { recursive: true });

    const primaryPath = join(dir, `${time}.json`);
    try {
      await writeFile(primaryPath, JSON.stringify(payload, null, 2), { encoding: 'utf-8', flag: 'wx' });
      return primaryPath;
    } catch {
      const fallbackPath = join(dir, `${time}-${Date.now()}.json`);
      await writeFile(fallbackPath, JSON.stringify(payload, null, 2), { encoding: 'utf-8' });
      return fallbackPath;
    }
  }
}
