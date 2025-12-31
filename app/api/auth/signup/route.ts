/**
 * POST /api/auth/signup
 *
 * 회원가입 API (Signup v2)
 * - 이메일 인증 완료 후 호출됨
 * - verificationToken을 받아서 회원가입 처리
 * - 자동 로그인 (세션 생성)
 */

import { NextRequest } from 'next/server';
import { EmailVerificationService } from '@/lib/server/services/email-verification.service';
import { LogService } from '@/lib/server/services/log.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import { getClientIp } from '@/lib/server/utils/request';
import { createServerClient, createAdminClient } from '@/lib/server/utils/supabase';
import { ApiError } from '@/lib/server/utils/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, verificationToken } = body;

    // 1. 입력 검증
    if (!verificationToken) {
      return handleApiError(new Error('인증 토큰이 필요합니다'), 400);
    }

    // 2. 검증된 인증 레코드 조회
    const verification = await EmailVerificationService.getVerifiedRecord(verificationToken);

    if (!verification) {
      return handleApiError(new Error('유효하지 않은 인증 토큰입니다'), 400);
    }

    // 이메일 일치 확인 (email이 제공된 경우에만)
    if (email && verification.email !== email) {
      return handleApiError(new Error('이메일이 일치하지 않습니다'), 400);
    }

    // 토큰에서 이메일 추출 (email이 제공되지 않은 경우)
    const userEmail = email || verification.email;

    // 3. Admin 클라이언트 생성 (사용자 생성용)
    const adminClient = await createAdminClient();

    // 4. 사용자 생성 (Admin API - Service Role Key 필요)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: verification.email,
      password: verification.hashed_password || '',
      email_confirm: true, // 이메일 인증 완료 상태로 생성
      user_metadata: {
        email_verified: true,
      },
    });

    if (authError || !authData.user) {
      console.error('[Signup] 사용자 생성 실패:', authError);
      throw new ApiError('회원가입에 실패했습니다', 500);
    }

    // 5. 일반 서버 클라이언트 생성 (프로필 생성 및 로그인용)
    const supabase = await createServerClient();

    // 6. profiles 테이블에 레코드 생성
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: verification.email,
      name: null,
      phone: null,
      main_address: null,
      detail_address: null,
    });

    if (profileError) {
      console.error('[Signup] 프로필 생성 실패:', profileError);
      // 프로필 생성 실패 시 auth.users도 롤백 (admin client 사용)
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw new ApiError('프로필 생성에 실패했습니다', 500);
    }

    // 7. 세션 생성 (자동 로그인)
    const { data: sessionData, error: sessionError } =
      await supabase.auth.signInWithPassword({
        email: verification.email,
        password: verification.hashed_password || '',
      });

    if (sessionError || !sessionData.session) {
      console.error('[Signup] 세션 생성 실패:', sessionError);
      throw new ApiError('로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.', 500);
    }

    // 8. email_verifications 레코드 삭제
    await EmailVerificationService.deleteVerification(verificationToken);

    // 9. 로그 기록
    const clientIp = getClientIp(request);
    await LogService.log({
      eventType: 'SIGNUP_SUCCESS',
      eventCategory: 'auth',
      userId: authData.user.id,
      message: `회원가입 성공: ${userEmail}`,
      metadata: { email: userEmail },
      ipAddress: clientIp,
    });

    // 10. 성공 응답
    return successResponse(
      {
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        },
      },
      '회원가입이 완료되었습니다!',
      201
    );
  } catch (error: any) {
    // 로그 기록
    const body = await request.json().catch(() => ({}));
    const clientIp = getClientIp(request);
    await LogService.log({
      eventType: 'SIGNUP_FAILED',
      eventCategory: 'auth',
      message: `회원가입 실패: ${error.message}`,
      metadata: { email: body.email, error: error.message },
      ipAddress: clientIp,
      severity: 'error',
    });

    return handleApiError(error);
  }
}
