/**
 * Projects Hooks
 *
 * 프로젝트 관련 React Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { ProjectsAPI } from '@/lib/client/api/projects.api';
import { queryKeys } from './query-keys';

/**
 * 프로젝트 목록 조회 Hook
 */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: () => ProjectsAPI.getProjects(),
    staleTime: 1000 * 60 * 10, // 10분
  });
}

/**
 * 프로젝트 단일 조회 Hook
 */
export function useProject(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id || ''),
    queryFn: () => ProjectsAPI.getProject(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10분
  });
}
