/**
 * POST /api/auth/update-password
 *
 * 비밀번호 재설정 확인 및 변경 API
 */

import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/server/services/auth.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import type { UpdatePasswordRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as UpdatePasswordRequest;
    const { token, newPassword: password } = body;

    if (!token || !password) {
      return handleApiError(
        new Error('토큰과 새 비밀번호를 입력해주세요')
      );
    }

    // 비밀번호 재설정 (로깅 포함)
    const { email } = await AuthService.resetPassword(token, password);

    return successResponse({
      email,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
