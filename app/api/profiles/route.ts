/**
 * Profiles API Routes
 *
 * GET /api/profiles - 본인 프로필 조회
 */

import { NextRequest } from 'next/server';
import { ProfileService } from '@/lib/server/services/profile.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import { getCurrentUser } from '@/lib/server/utils/supabase';

/**
 * 본인 프로필 조회
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return handleApiError(new Error('로그인이 필요합니다'));
    }

    const profile = await ProfileService.getProfile(user.id);
    return successResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
