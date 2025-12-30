/**
 * POST /api/auth/logout
 *
 * 로그아웃 API
 */

import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/server/services/auth.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import { getCurrentUser } from '@/lib/server/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return handleApiError(
        new Error('로그인이 필요합니다')
      );
    }

    // 로그아웃 처리 (로깅 포함)
    await AuthService.logout(user.id);

    return successResponse({
      message: '로그아웃되었습니다',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
