/**
 * Profile Detail API Routes
 *
 * GET /api/profiles/:id - 프로필 조회
 * PATCH /api/profiles/:id - 프로필 수정
 */

import { NextRequest } from 'next/server';
import { ProfileService } from '@/lib/server/services/profile.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import { getCurrentUser } from '@/lib/server/utils/supabase';
import type { UpdateProfileRequest } from '@/types/api';

/**
 * 프로필 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await ProfileService.getProfile(params.id);
    return successResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 프로필 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return handleApiError(new Error('로그인이 필요합니다'));
    }

    const body = await request.json() as UpdateProfileRequest;

    const profile = await ProfileService.updateProfile(
      params.id,
      user.id,
      body
    );

    return successResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
