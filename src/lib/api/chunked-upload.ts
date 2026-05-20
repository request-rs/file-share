import { appConfig } from '@/config';

export interface ChunkedUploadCallbacks {
  onProgress: (uploaded: number, total: number) => void;
}

const BASE_URL = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(appConfig.tokenStorageKey);
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '请求失败' }));
    throw Object.assign(new Error(err.message || `请求失败 (${res.status})`), { status: res.status, code: err.error });
  }
  return res.json();
}

async function apiGet<T>(path: string): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '请求失败' }));
    throw new Error(err.message || `请求失败 (${res.status})`);
  }
  return res.json();
}

async function apiDelete(path: string): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
}

export const chunkedUpload = {
  async init(file: File): Promise<{ uploadId: string; fileId: string; totalChunks: number; chunkSize: number }> {
    const chunkSize = appConfig.chunkSize;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const res = await apiPost<{ success: boolean; uploadId: string; fileId: string; totalChunks: number; chunkSize: number }>('/uploads/init', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      chunkSize,
      totalChunks,
      expiresAt: null,
    });
    return res;
  },

  async uploadChunk(uploadId: string, chunkIndex: number, totalChunks: number, chunk: Blob): Promise<void> {
    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', String(chunkIndex));
    formData.append('totalChunks', String(totalChunks));
    formData.append('chunk', chunk, `chunk-${chunkIndex}`);

    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/uploads/chunk`, { method: 'POST', headers, body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: '分片上传失败' }));
      throw new Error(err.message || '分片上传失败');
    }
  },

  async complete(data: {
    uploadId: string;
    fileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    totalChunks: number;
  }) {
    return apiPost<{ success: boolean; file: Record<string, unknown> }>('/uploads/complete', {
      ...data,
      expiresAt: null,
    });
  },

  async getStatus(uploadId: string): Promise<{ uploadedChunks: number[]; missingChunks: number[]; totalChunks: number }> {
    return apiGet(`/uploads/${uploadId}/status`);
  },

  async cleanup(uploadId: string): Promise<void> {
    try { await apiDelete(`/uploads/${uploadId}`); } catch { /* ignore */ }
  },
};
