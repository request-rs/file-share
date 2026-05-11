import { apiClient } from './client';
import { ShareLinkListResponse, CreateShareLinkRequest, CreateShareLinkResponse, DeleteShareLinkResponse } from '@/types/file';

export const sharesApi = {
  getShares(): Promise<ShareLinkListResponse> {
    return apiClient.get<ShareLinkListResponse>('/shares');
  },

  createShareLink(data: CreateShareLinkRequest): Promise<CreateShareLinkResponse> {
    return apiClient.post<CreateShareLinkResponse>('/shares', data);
  },

  deleteShareLink(id: string): Promise<DeleteShareLinkResponse> {
    return apiClient.delete<DeleteShareLinkResponse>(`/shares/${id}`);
  },
};
