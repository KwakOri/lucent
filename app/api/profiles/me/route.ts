/**
 * My Profile API Routes
 *
 * PATCH /api/profiles/me - 본인 프로필 업데이트
 */

import { NextRequest } from 'next/server';
import { ProfileService } from '@/lib/server/services/profile.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import { getCurrentUser } from '@/lib/server/utils/supabase';

/**
 * 본인 프로필 업데이트
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return handleApiError(new Error('로그인이 필요합니다'), 401);
    }

    const body = await request.json();
    const { name, phone, main_address, detail_address } = body;

    // ProfileService에 업데이트 요청
    const updatedProfile = await ProfileService.updateProfile(
      user.id,
      user.id, // requesterId = userId (본인 수정)
      {
        name: name || null,
        phone: phone || null,
        main_address: main_address || null,
        detail_address: detail_address || null,
      }
    );

    return successResponse(updatedProfile, '프로필이 업데이트되었습니다');
  } catch (error) {
    return handleApiError(error);
  }
}
