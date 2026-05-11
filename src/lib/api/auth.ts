import { apiClient } from './client';
import { LoginResponse } from '@/types/file';

export const authApi = {
  login(password: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', { password });
  },
};
