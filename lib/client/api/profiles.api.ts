/**
 * Profiles API Client
 *
 * 프로필 관련 API 호출
 */

import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse } from '@/types';
import type { Tables, TablesUpdate } from '@/types/database';

type Profile = Tables<'profiles'>;

/**
 * 프로필 업데이트 데이터
 */
export interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
}

/**
 * Profiles API
 */
export const ProfilesAPI = {
  /**
   * 내 프로필 조회
   */
  async getMyProfile(): Promise<ApiResponse<Profile>> {
    return apiClient.get('/api/profiles');
  },

  /**
   * 프로필 업데이트
   */
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<Profile>> {
    return apiClient.patch('/api/profiles', data);
  },
};
