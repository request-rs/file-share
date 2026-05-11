export interface FileItem {
  id: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  expiresAt: string;
  status: 'active' | 'expired';
  downloadUrl: string;
}

export interface FileListResponse {
  files: FileItem[];
}

export interface UploadResponse {
  success: boolean;
  files: FileItem[];
}

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
}

export interface DeleteResponse {
  success: boolean;
}

export interface UploadTask {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error: string;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export type ApiResponse<T> = T | ApiErrorResponse;
