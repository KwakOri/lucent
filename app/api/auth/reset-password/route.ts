/**
 * POST /api/auth/reset-password
 *
 * 비밀번호 재설정 요청 API
 */

import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/server/services/auth.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import type { ResetPasswordRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ResetPasswordRequest;
    const { email } = body;

    if (!email) {
      return handleApiError(
        new Error('이메일을 입력해주세요')
      );
    }

    // 비밀번호 재설정 이메일 발송 (로깅 포함)
    await AuthService.requestPasswordReset(email);

    return successResponse({
      message: '비밀번호 재설정 이메일이 발송되었습니다.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
