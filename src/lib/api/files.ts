import { apiClient } from './client';
import { FileListResponse, UploadResponse, DeleteResponse, DownloadProgress } from '@/types/file';

export const filesApi = {
  getFiles(): Promise<FileListResponse> {
    return apiClient.get<FileListResponse>('/files');
  },

  upload(
    files: File[],
    options?: {
      expiresAt?: string;
      onProgress?: (progress: number) => void;
      signal?: AbortSignal;
    }
  ): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (options?.expiresAt) {
      formData.append('expiresAt', options.expiresAt);
    }
    return apiClient.upload<UploadResponse>('/files/upload', formData, {
      onProgress: options?.onProgress,
      signal: options?.signal,
    });
  },

  getDownloadUrl(fileId: string): string {
    return `/api/files/${fileId}/download`;
  },

  deleteFile(fileId: string): Promise<DeleteResponse> {
    return apiClient.delete<DeleteResponse>(`/files/${fileId}`);
  },

  downloadFileWithProgress(
    fileId: string,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<Blob> {
    return apiClient.downloadWithProgress(`/files/${fileId}/download`, onProgress);
  },
};
