import { FileItem } from '@/types/file';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export async function getFiles(): Promise<FileItem[]> {
  const files = await prisma.file.findMany({
    orderBy: { uploadedAt: 'desc' },
  });

  const now = new Date();

  return files.map((f) => ({
    id: f.id,
    originalName: f.originalName,
    size: f.size,
    uploadedAt: f.uploadedAt.toISOString(),
    expiresAt: f.expiresAt.toISOString(),
    status: new Date(f.expiresAt) < now ? 'expired' : 'active' as const,
    downloadUrl: `/api/files/${f.id}/download`,
  }));
}

export async function addFile(
  originalName: string,
  buffer: Buffer,
  mimeType: string,
  expireDays: number = 7
): Promise<FileItem> {
  const id = randomUUID();
  const storedName = randomUUID();

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const storagePath = path.resolve(UPLOAD_DIR, storedName);
  await fs.writeFile(storagePath, buffer);

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + expireDays);

  await prisma.file.create({
    data: {
      id,
      originalName,
      storedName,
      size: buffer.length,
      mimeType: mimeType || 'application/octet-stream',
      storagePath,
      uploadedAt: now,
      expiresAt,
    },
  });

  return {
    id,
    originalName,
    size: buffer.length,
    uploadedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    downloadUrl: `/api/files/${id}/download`,
  };
}

export async function getFileRecord(id: string) {
  return prisma.file.findUnique({ where: { id } });
}

export async function incrementDownloadCount(id: string) {
  await prisma.file.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });
}

export async function deleteFileRecord(id: string): Promise<{ originalName: string; storagePath: string } | null> {
  const record = await prisma.file.findUnique({ where: { id } });
  if (!record) return null;

  try {
    await fs.unlink(record.storagePath);
  } catch {
    // 磁盘文件可能已被删除，忽略错误
  }

  await prisma.file.delete({ where: { id } });
  return { originalName: record.originalName, storagePath: record.storagePath };
}
