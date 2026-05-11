import { FileItem } from '@/types/file';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

type FileStatus = 'active' | 'expired';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

function resolveStoragePath(filePath: string): string {
  const resolved = path.resolve(filePath);
  const uploadDir = path.resolve(UPLOAD_DIR);
  if (!resolved.startsWith(uploadDir + path.sep) && resolved !== uploadDir) {
    throw new Error('Invalid storage path');
  }
  return resolved;
}

export async function getFiles(params?: {
  filter?: string;
  sort?: string;
  search?: string;
}): Promise<FileItem[]> {
  const orderBy: Record<string, string>[] = [{ isPinned: 'desc' }, { uploadedAt: 'desc' }];

  if (params?.sort === 'name') {
    orderBy.length = 0;
    orderBy.push({ isPinned: 'desc' }, { originalName: 'asc' });
  } else if (params?.sort === 'size') {
    orderBy.length = 0;
    orderBy.push({ isPinned: 'desc' }, { size: 'desc' });
  } else if (params?.sort === 'expiry') {
    orderBy.length = 0;
    orderBy.push({ isPinned: 'desc' }, { expiresAt: 'asc' });
  } else if (params?.sort === 'oldest') {
    orderBy.length = 0;
    orderBy.push({ isPinned: 'desc' }, { uploadedAt: 'asc' });
  }

  const where: Record<string, unknown> = {};

  if (params?.search) {
    where.originalName = { contains: params.search };
  }

  if (params?.filter === 'active') {
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gte: new Date() } },
    ];
  } else if (params?.filter === 'expired') {
    where.expiresAt = { lt: new Date() };
    where.NOT = { expiresAt: null };
  } else if (params?.filter === 'permanent') {
    where.expiresAt = null;
  } else if (params?.filter === 'pinned') {
    where.isPinned = true;
  }

  const files = await prisma.file.findMany({
    orderBy: orderBy as never,
    where: where as never,
  });

  const now = new Date();

  return files.map((f) => ({
    id: f.id,
    originalName: f.originalName,
    size: f.size,
    uploadedAt: f.uploadedAt.toISOString(),
    expiresAt: f.expiresAt?.toISOString() ?? null,
    status: (f.expiresAt && f.expiresAt < now ? 'expired' : 'active') as FileStatus,
    downloadUrl: `/api/files/${f.id}/download`,
    isPinned: f.isPinned,
    downloadCount: f.downloadCount,
  }));
}

export async function addFile(
  originalName: string,
  buffer: Buffer,
  mimeType: string,
  expireDays: number | null = null
): Promise<FileItem> {
  const id = randomUUID();
  const storedName = randomUUID();

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const storagePath = path.resolve(UPLOAD_DIR, storedName);
  await fs.writeFile(storagePath, buffer);

  const now = new Date();
  let expiresAt: Date | null = null;
  if (expireDays !== null && expireDays > 0) {
    expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + expireDays);
  }

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
    expiresAt: expiresAt?.toISOString() ?? null,
    status: 'active',
    downloadUrl: `/api/files/${id}/download`,
    isPinned: false,
    downloadCount: 0,
  };
}

export async function getFileRecord(id: string) {
  return prisma.file.findUnique({ where: { id } });
}

export async function setFilePinned(id: string, isPinned: boolean) {
  const record = await prisma.file.findUnique({ where: { id } });
  if (!record) return null;

  const updated = await prisma.file.update({
    where: { id },
    data: { isPinned },
  });

  const now = new Date();
  return {
    id: updated.id,
    originalName: updated.originalName,
    size: updated.size,
    uploadedAt: updated.uploadedAt.toISOString(),
    expiresAt: updated.expiresAt?.toISOString() ?? null,
    status: (updated.expiresAt && updated.expiresAt < now ? 'expired' : 'active') as FileStatus,
    downloadUrl: `/api/files/${updated.id}/download`,
    isPinned: updated.isPinned,
    downloadCount: updated.downloadCount,
  };
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
    // disk file may already be deleted
  }

  await prisma.shareFile.deleteMany({ where: { fileId: id } });
  await prisma.file.delete({ where: { id } });
  return { originalName: record.originalName, storagePath: record.storagePath };
}
