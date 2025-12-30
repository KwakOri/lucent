/**
 * Projects API Client
 *
 * 프로젝트 관련 API 호출
 */

import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse } from '@/types';
import type { Tables } from '@/types/database';

type Project = Tables<'projects'>;

/**
 * 프로젝트 상세 정보 (커버 이미지 포함)
 */
export interface ProjectWithDetails extends Project {
  cover_image?: {
    id: string;
    public_url: string;
    alt_text: string | null;
  } | null;
}

/**
 * Projects API
 */
export const ProjectsAPI = {
  /**
   * 프로젝트 목록 조회
   */
  async getProjects(): Promise<ApiResponse<ProjectWithDetails[]>> {
    return apiClient.get('/api/projects');
  },

  /**
   * 프로젝트 단일 조회 (ID)
   */
  async getProject(id: string): Promise<ApiResponse<ProjectWithDetails>> {
    return apiClient.get(`/api/projects/${id}`);
  },
};
