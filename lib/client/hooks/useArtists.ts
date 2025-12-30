/**
 * Artists Hooks
 *
 * 아티스트 관련 React Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { ArtistsAPI } from '@/lib/client/api/artists.api';
import { queryKeys } from './query-keys';

/**
 * 아티스트 목록 조회 Hook
 */
export function useArtists() {
  return useQuery({
    queryKey: queryKeys.artists.lists(),
    queryFn: () => ArtistsAPI.getArtists(),
    staleTime: 1000 * 60 * 10, // 10분 (아티스트 정보는 자주 변경되지 않음)
  });
}

/**
 * 아티스트 단일 조회 Hook
 */
export function useArtist(slug: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.artists.detail(slug || ''),
    queryFn: () => ArtistsAPI.getArtist(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10, // 10분
  });
}
