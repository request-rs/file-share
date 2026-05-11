import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import {
  ShareLinkItem,
  CreateShareLinkRequest,
  PublicShareInfo,
  PublicShareFile,
} from '@/types/file';

export async function getShares(): Promise<ShareLinkItem[]> {
  const shares = await prisma.shareLink.findMany({
    include: { files: true },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();

  return shares.map((s) => ({
    id: s.id,
    token: s.token,
    title: s.title,
    url: `/share/${s.token}`,
    fileCount: s.files.length,
    expiresAt: s.expiresAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    status: (s.expiresAt && s.expiresAt < now ? 'expired' : 'active') as ShareLinkItem['status'],
  }));
}

export async function createShareLink(data: CreateShareLinkRequest): Promise<ShareLinkItem | null> {
  const token = randomUUID().replace(/-/g, '').substring(0, 12);

  let expiresAt: Date | null = null;
  if (data.expiresAt) {
    expiresAt = new Date(data.expiresAt);
  }

  const existingFiles = await prisma.file.findMany({
    where: { id: { in: data.fileIds } },
  });

  if (existingFiles.length === 0) return null;

  const share = await prisma.shareLink.create({
    data: {
      token,
      title: data.title || null,
      expiresAt,
      files: {
        create: existingFiles.map((f) => ({
          fileId: f.id,
        })),
      },
    },
    include: { files: true },
  });

  return {
    id: share.id,
    token: share.token,
    title: share.title,
    url: `/share/${share.token}`,
    fileCount: share.files.length,
    expiresAt: share.expiresAt?.toISOString() ?? null,
    createdAt: share.createdAt.toISOString(),
    status: 'active',
  };
}

export async function deleteShareLink(id: string): Promise<boolean> {
  const existing = await prisma.shareLink.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.shareLink.delete({ where: { id } });
  return true;
}

export async function getPublicShare(token: string): Promise<{
  share: PublicShareInfo;
  files: PublicShareFile[];
} | null> {
  const share = await prisma.shareLink.findUnique({
    where: { token },
    include: { files: { include: { file: true } } },
  });

  if (!share) return null;

  const now = new Date();
  const shareExpired = share.expiresAt && share.expiresAt < now;

  const validFiles: PublicShareFile[] = [];

  for (const sf of share.files) {
    const f = sf.file;
    if (!f) continue;
    const fileExpired = f.expiresAt && f.expiresAt < now;
    validFiles.push({
      id: f.id,
      originalName: f.originalName,
      size: f.size,
      uploadedAt: f.uploadedAt.toISOString(),
      expiresAt: f.expiresAt?.toISOString() ?? null,
      status: fileExpired ? 'expired' : 'active',
    });
  }

  return {
    share: {
      token: share.token,
      title: share.title,
      expiresAt: share.expiresAt?.toISOString() ?? null,
      status: shareExpired ? 'expired' : 'active',
      createdAt: share.createdAt.toISOString(),
    },
    files: validFiles,
  };
}

export async function getShareFileRecord(token: string, fileId: string) {
  const shareFile = await prisma.shareFile.findFirst({
    where: {
      shareLink: { token },
      fileId,
    },
    include: {
      shareLink: true,
      file: true,
    },
  });

  return shareFile;
}
