import { appConfig } from '@/config';
import { DownloadProgress } from '@/types/file';

const BASE_URL = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(appConfig.tokenStorageKey);
}

interface RequestOptions extends RequestInit {
  timeout?: number;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {};

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...((options.headers as Record<string, string>) || {}) },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '网络错误' }));
      throw new Error(error.message || `请求失败 (${response.status})`);
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  upload<T>(
    endpoint: string,
    formData: FormData,
    options?: {
      onProgress?: (progress: number) => void;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      const abortHandler = () => {
        xhr.abort();
      };

      if (options?.signal) {
        if (options.signal.aborted) {
          reject(new Error('上传已取消'));
          return;
        }
        options.signal.addEventListener('abort', abortHandler, { once: true });
      }

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && options?.onProgress) {
          options.onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (options?.signal) {
          options.signal.removeEventListener('abort', abortHandler);
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error('响应解析失败'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || '上传失败'));
          } catch {
            reject(new Error('上传失败'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        if (options?.signal) {
          options.signal.removeEventListener('abort', abortHandler);
        }
        reject(new Error('网络错误'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('上传已取消'));
      });

      const token = getToken();
      xhr.open('POST', `${BASE_URL}${endpoint}`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  }

  async downloadWithProgress(
    endpoint: string,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<Blob> {
    const token = getToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '下载失败' }));
      throw new Error(error.message || `下载失败 (${response.status})`);
    }

    const contentLength = Number(response.headers.get('Content-Length') || '0');
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const chunks: BlobPart[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress({
        loaded: received,
        total: contentLength,
        percentage: contentLength > 0 ? Math.round((received / contentLength) * 100) : 0,
      });
    }

    return new Blob(chunks);
  }
}

export const apiClient = new ApiClient();
