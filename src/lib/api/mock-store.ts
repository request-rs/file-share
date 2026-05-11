// @ts-nocheck
// This file is replaced by file-store.ts for the real database implementation.
// Kept for reference only.

import { getExpiryDate } from '@/utils/format';

export interface MockFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  expiresAt: string;
  downloadUrl: string;
  content: Blob;
}

let fileStore: MockFile[] = [];

function generateId(): string {
  return 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

export const mockStore = {
  getFiles() {
    const now = new Date();
    return fileStore
      .filter((f) => new Date(f.expiresAt) > now)
      .map(({ content, ...rest }) => rest)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  addFile(name: string, size: number, content: Blob, expireDays: number = 7) {
    const id = generateId();
    const now = new Date().toISOString();
    const expiresAt = getExpiryDate(expireDays);

    const mockFile: MockFile = {
      id,
      name,
      size,
      uploadedAt: now,
      expiresAt,
      downloadUrl: `/api/files/${id}/download`,
      content,
    };

    fileStore.push(mockFile);
    const { content: _, ...item } = mockFile;
    return item;
  },

  getFileContent(id: string): { content: Blob; name: string } | null {
    const file = fileStore.find((f) => f.id === id);
    if (!file || new Date(file.expiresAt) < new Date()) return null;
    return { content: file.content, name: file.name };
  },

  clearExpired(): void {
    const now = new Date();
    fileStore = fileStore.filter((f) => new Date(f.expiresAt) > now);
  },
};
