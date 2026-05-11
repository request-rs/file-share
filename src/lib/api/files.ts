import { apiClient } from './client';
import { FileListResponse, UploadResponse, DeleteResponse, PinResponse, DownloadProgress, DownloadTokenResponse } from '@/types/file';

export const filesApi = {
  getFiles(params?: {
    filter?: string;
    sort?: string;
    search?: string;
  }): Promise<FileListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.filter) searchParams.set('filter', params.filter);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return apiClient.get<FileListResponse>(`/files${qs ? `?${qs}` : ''}`);
  },

  upload(
    files: File[],
    options?: {
      expiresAt?: string | null;
      onProgress?: (progress: number) => void;
      signal?: AbortSignal;
    }
  ): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (options?.expiresAt) {
      formData.append('expiresAt', options.expiresAt);
    } else if (options?.expiresAt === null || options?.expiresAt === undefined) {
      formData.append('expiresAt', 'permanent');
    }
    return apiClient.upload<UploadResponse>('/files/upload', formData, {
      onProgress: options?.onProgress,
      signal: options?.signal,
    });
  },

  getDownloadUrl(fileId: string): string {
    return `/api/files/${fileId}/download`;
  },

  getDownloadToken(fileId: string): Promise<DownloadTokenResponse> {
    return apiClient.get<DownloadTokenResponse>(`/files/${fileId}/download-token`);
  },

  getNativeDownloadUrl(fileId: string): Promise<string> {
    return this.getDownloadToken(fileId).then((res) => res.url);
  },

  deleteFile(fileId: string): Promise<DeleteResponse> {
    return apiClient.delete<DeleteResponse>(`/files/${fileId}`);
  },

  pinFile(fileId: string, isPinned: boolean): Promise<PinResponse> {
    return apiClient.patch<PinResponse>(`/files/${fileId}/pin`, { isPinned });
  },

  downloadFileWithProgress(
    fileId: string,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<Blob> {
    return apiClient.downloadWithProgress(`/files/${fileId}/download`, onProgress);
  },
};
