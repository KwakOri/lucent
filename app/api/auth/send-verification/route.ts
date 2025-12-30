/**
 * POST /api/auth/send-verification
 *
 * 이메일 인증 발송 API
 */

import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/server/services/auth.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import type { SendVerificationRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SendVerificationRequest;
    const { email } = body;

    // 입력 검증
    if (!email) {
      return handleApiError(
        new Error('이메일을 입력해주세요')
      );
    }

    // 이메일 인증 발송 (로깅 포함)
    await AuthService.sendEmailVerification(email);

    return successResponse({
      message: '인증 이메일이 발송되었습니다. 이메일을 확인해주세요.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
