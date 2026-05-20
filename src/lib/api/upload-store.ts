import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/db/prisma';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const UPLOAD_TMP_DIR = process.env.UPLOAD_TMP_DIR || './uploads/tmp';

export function getChunkDir(uploadId: string): string {
  return path.resolve(UPLOAD_TMP_DIR, uploadId);
}

export function getChunkPath(uploadId: string, chunkIndex: number): string {
  return path.resolve(getChunkDir(uploadId), `chunk-${chunkIndex}`);
}

export async function initUpload(data: {
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkSize: number;
  totalChunks: number;
  expiresAt: string | null;
}): Promise<{ uploadId: string; fileId: string }> {
  const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '1024', 10) * 1024 * 1024;
  if (data.fileSize > maxSize) {
    throw Object.assign(new Error(`文件超过 ${Math.round(maxSize / 1024 / 1024)} MB 限制`), { code: 'FILE_TOO_LARGE' });
  }

  const uploadId = randomUUID();
  const fileId = randomUUID();
  const chunkDir = getChunkDir(uploadId);

  await fs.mkdir(UPLOAD_TMP_DIR, { recursive: true });
  await fs.mkdir(chunkDir, { recursive: true });

  const meta = {
    uploadId,
    fileId,
    fileName: data.fileName,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    chunkSize: data.chunkSize,
    totalChunks: data.totalChunks,
    expiresAt: data.expiresAt,
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile(path.join(chunkDir, 'meta.json'), JSON.stringify(meta));

  return { uploadId, fileId };
}

export async function saveChunk(uploadId: string, chunkIndex: number, buffer: Buffer): Promise<void> {
  const chunkDir = getChunkDir(uploadId);
  try {
    await fs.access(chunkDir);
  } catch {
    throw Object.assign(new Error('上传会话不存在'), { code: 'INVALID_UPLOAD_ID' });
  }

  const chunkPath = getChunkPath(uploadId, chunkIndex);
  await fs.writeFile(chunkPath, buffer);
}

export async function getUploadStatus(uploadId: string): Promise<{
  exists: boolean;
  uploadedChunks: number[];
  missingChunks: number[];
  totalChunks: number;
} | null> {
  const chunkDir = getChunkDir(uploadId);
  const metaPath = path.join(chunkDir, 'meta.json');

  let meta: { totalChunks: number } | null = null;
  try {
    meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
  } catch {
    try { await fs.access(chunkDir); } catch { return null; }
    return null;
  }

  if (!meta) return null;

  const entries = await fs.readdir(chunkDir);
  const uploadedChunks: number[] = [];
  for (const entry of entries) {
    const match = entry.match(/^chunk-(\d+)$/);
    if (match) {
      const stat = await fs.stat(path.join(chunkDir, entry));
      if (stat.size > 0) {
        uploadedChunks.push(parseInt(match[1], 10));
      }
    }
  }
  uploadedChunks.sort((a, b) => a - b);

  const missingChunks: number[] = [];
  for (let i = 0; i < meta!.totalChunks; i++) {
    if (!uploadedChunks.includes(i)) {
      missingChunks.push(i);
    }
  }

  return {
    exists: true,
    uploadedChunks,
    missingChunks,
    totalChunks: meta.totalChunks,
  };
}

export async function completeUpload(data: {
  uploadId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalChunks: number;
  expiresAt: string | null;
}) {
  const chunkDir = getChunkDir(data.uploadId);
  const metaPath = path.join(chunkDir, 'meta.json');

  let meta: Record<string, unknown> | null = null;
  try {
    meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
  } catch {
    throw Object.assign(new Error('上传会话不存在'), { code: 'INVALID_UPLOAD_ID' });
  }

  for (let i = 0; i < data.totalChunks; i++) {
    try {
      await fs.access(getChunkPath(data.uploadId, i));
    } catch {
      throw Object.assign(new Error(`缺少分片 ${i}`), { code: 'MISSING_CHUNKS' });
    }
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const storedName = randomUUID();
  const storagePath = path.resolve(UPLOAD_DIR, storedName);

  const finalFile = await fs.open(storagePath, 'w');
  let totalWritten = 0;

  try {
    for (let i = 0; i < data.totalChunks; i++) {
      const chunkBuf = await fs.readFile(getChunkPath(data.uploadId, i));
      await finalFile.write(chunkBuf);
      totalWritten += chunkBuf.length;
    }
  } finally {
    await finalFile.close();
  }

  if (totalWritten !== data.fileSize) {
    try { await fs.unlink(storagePath); } catch { /* ignore */ }
    throw Object.assign(new Error(`文件大小不一致: 期望 ${data.fileSize}, 实际 ${totalWritten}`), { code: 'MERGE_FAILED' });
  }

  let expiresAt: Date | null = null;
  if (data.expiresAt) {
    expiresAt = new Date(data.expiresAt);
  }

  const record = await prisma.file.create({
    data: {
      id: data.fileId,
      originalName: data.fileName,
      storedName,
      size: data.fileSize,
      mimeType: data.mimeType || 'application/octet-stream',
      storagePath,
      uploadedAt: new Date(),
      expiresAt,
    },
  });

  await cleanupUpload(data.uploadId);

  const now = new Date();
  return {
    id: record.id,
    originalName: record.originalName,
    size: record.size,
    uploadedAt: record.uploadedAt.toISOString(),
    expiresAt: record.expiresAt?.toISOString() ?? null,
    status: (record.expiresAt && record.expiresAt < now ? 'expired' : 'active') as 'active' | 'expired',
    downloadUrl: `/api/files/${record.id}/download`,
    isPinned: record.isPinned,
    downloadCount: record.downloadCount,
  };
}

export async function cleanupUpload(uploadId: string): Promise<void> {
  const chunkDir = getChunkDir(uploadId);
  try {
    await fs.rm(chunkDir, { recursive: true, force: true });
  } catch {
    // may already be cleaned up
  }
}

export async function cleanupStaleUploads(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
  let cleaned = 0;
  try {
    await fs.mkdir(UPLOAD_TMP_DIR, { recursive: true });
    const entries = await fs.readdir(UPLOAD_TMP_DIR, { withFileTypes: true });
    const now = Date.now();
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dirPath = path.join(UPLOAD_TMP_DIR, entry.name);
      try {
        const stat = await fs.stat(dirPath);
        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.rm(dirPath, { recursive: true, force: true });
          cleaned++;
        }
      } catch {
        // skip
      }
    }
  } catch {
    // tmp dir may not exist
  }
  return cleaned;
}
