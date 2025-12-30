/**
 * Artists API Client
 *
 * 아티스트 관련 API 호출
 */

import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse } from '@/types';
import type { Tables } from '@/types/database';

type Artist = Tables<'artists'>;

/**
 * 아티스트 상세 정보 (프로필 이미지 포함)
 */
export interface ArtistWithDetails extends Artist {
  profile_image?: {
    id: string;
    public_url: string;
    alt_text: string | null;
  } | null;
}

/**
 * Artists API
 */
export const ArtistsAPI = {
  /**
   * 아티스트 목록 조회
   */
  async getArtists(): Promise<ApiResponse<ArtistWithDetails[]>> {
    return apiClient.get('/api/artists');
  },

  /**
   * 아티스트 단일 조회 (Slug)
   */
  async getArtist(slug: string): Promise<ApiResponse<ArtistWithDetails>> {
    return apiClient.get(`/api/artists/${slug}`);
  },
};
