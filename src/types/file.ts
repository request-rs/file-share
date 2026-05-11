export interface FileItem {
  id: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  expiresAt: string | null;
  status: 'active' | 'expired';
  downloadUrl: string;
  isPinned: boolean;
  downloadCount: number;
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

export interface PinResponse {
  success: boolean;
  file: FileItem;
}

export interface UploadTask {
  id: string;
  fileName: string;
  fileSize: number;
  fileId?: string;
  downloadUrl?: string;
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

export interface ShareLinkItem {
  id: string;
  token: string;
  title: string | null;
  url: string;
  fileCount: number;
  expiresAt: string | null;
  createdAt: string;
  status: 'active' | 'expired';
}

export interface ShareLinkListResponse {
  shares: ShareLinkItem[];
}

export interface CreateShareLinkRequest {
  fileIds: string[];
  expiresAt: string | null;
  title?: string;
}

export interface CreateShareLinkResponse {
  success: boolean;
  share: ShareLinkItem;
}

export interface DeleteShareLinkResponse {
  success: boolean;
}

export interface PublicShareInfo {
  token: string;
  title: string | null;
  expiresAt: string | null;
  status: 'active' | 'expired';
  createdAt: string;
}

export interface PublicShareFile {
  id: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  expiresAt: string | null;
  status: 'active' | 'expired';
}

export interface PublicShareResponse {
  share: PublicShareInfo;
  files: PublicShareFile[];
}

export interface DownloadTokenResponse {
  token: string;
  url: string;
}
