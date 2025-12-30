/**
 * Profile Hooks
 *
 * 프로필 관련 React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProfilesAPI, type UpdateProfileData } from '@/lib/client/api/profiles.api';
import { queryKeys } from './query-keys';

/**
 * 내 프로필 조회 Hook
 */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.my(),
    queryFn: () => ProfilesAPI.getMyProfile(),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 프로필 업데이트 Hook
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => ProfilesAPI.updateProfile(data),
    onSuccess: () => {
      // 프로필 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.my(),
      });
    },
  });
}
