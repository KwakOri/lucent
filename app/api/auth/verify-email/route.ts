/**
 * GET /api/auth/verify-email
 *
 * 이메일 인증 확인 API
 */

import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/server/services/auth.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    // 입력 검증
    if (!token) {
      return handleApiError(
        new Error('인증 토큰이 필요합니다')
      );
    }

    // 이메일 인증 확인 (로깅 포함)
    const { email } = await AuthService.verifyEmail(token);

    return successResponse({
      email,
      message: '이메일 인증이 완료되었습니다. 회원가입을 진행해주세요.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
