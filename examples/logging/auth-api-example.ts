/**
 * 인증 API에 로깅 적용 예시
 *
 * 이 파일은 실제 인증 API를 구현할 때 참고하는 예시 코드입니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LogService } from '@/lib/server/services/log.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import { getClientIp } from '@/lib/server/utils/request';

// ===== 회원가입 API 예시 =====

export async function signupExample(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // TODO: 실제 회원가입 로직 (Supabase Auth 사용)
    // const { data, error } = await supabase.auth.signUp({ email, password });

    // 성공 시 로그 기록
    const userId = 'user-id-from-signup'; // 실제로는 Supabase에서 반환한 user.id
    await LogService.logSignupSuccess(
      userId,
      email,
      getClientIp(request),
      request.headers.get('user-agent') || undefined
    );

    return successResponse({ userId, email });
  } catch (error) {
    // 실패 시 로그 기록
    const email = 'email-from-request'; // request body에서 추출
    await LogService.logSignupFailed(
      email,
      error instanceof Error ? error.message : '알 수 없는 오류',
      getClientIp(request)
    );

    return handleApiError(error);
  }
}

// ===== 로그인 API 예시 =====

export async function loginExample(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // TODO: 실제 로그인 로직 (Supabase Auth 사용)
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    const userId = 'user-id-from-login'; // 실제로는 Supabase에서 반환한 user.id

    // 성공 시 로그 기록
    await LogService.logLoginSuccess(
      userId,
      getClientIp(request),
      request.headers.get('user-agent') || undefined
    );

    return successResponse({ userId, email });
  } catch (error) {
    // 실패 시 로그 기록
    const email = 'email-from-request';
    await LogService.logLoginFailed(
      email,
      error instanceof Error ? error.message : '잘못된 이메일 또는 비밀번호',
      getClientIp(request),
      request.headers.get('user-agent') || undefined
    );

    return handleApiError(error);
  }
}

// ===== 로그아웃 API 예시 =====

export async function logoutExample(request: NextRequest) {
  try {
    // TODO: 실제 로그아웃 로직
    // const { error } = await supabase.auth.signOut();

    const userId = 'current-user-id'; // 세션에서 가져온 user.id

    // 로그아웃 로그 기록
    await LogService.logLogout(userId);

    return successResponse({ message: '로그아웃되었습니다' });
  } catch (error) {
    return handleApiError(error);
  }
}

// ===== 이메일 인증 발송 API 예시 =====

export async function sendEmailVerificationExample(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    // TODO: 이메일 인증 발송 로직
    // await sendVerificationEmail(email);

    // 로그 기록
    await LogService.logEmailVerificationSent(email, userId);

    return successResponse({ message: '인증 이메일이 발송되었습니다' });
  } catch (error) {
    return handleApiError(error);
  }
}

// ===== 이메일 인증 확인 API 예시 =====

export async function verifyEmailExample(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    // TODO: 이메일 인증 확인 로직
    // const isValid = await verifyToken(token);

    const userId = 'user-id-from-token';

    // 성공 시 로그 기록
    await LogService.logEmailVerificationSuccess(userId, email);

    return successResponse({ message: '이메일 인증이 완료되었습니다' });
  } catch (error) {
    // 실패 시 로그 기록
    const email = 'email-from-request';
    await LogService.logEmailVerificationFailed(
      email,
      error instanceof Error ? error.message : '유효하지 않은 토큰'
    );

    return handleApiError(error);
  }
}

// ===== 비밀번호 재설정 요청 API 예시 =====

export async function requestPasswordResetExample(request: NextRequest) {
  try {
    const { email } = await request.json();

    // TODO: 비밀번호 재설정 이메일 발송
    // await sendPasswordResetEmail(email);

    // 로그 기록
    await LogService.logPasswordResetRequested(email);

    return successResponse({ message: '비밀번호 재설정 이메일이 발송되었습니다' });
  } catch (error) {
    return handleApiError(error);
  }
}

// ===== 비밀번호 재설정 완료 API 예시 =====

export async function resetPasswordExample(request: NextRequest) {
  try {
    const { token, newPassword, email } = await request.json();

    // TODO: 비밀번호 재설정 로직
    // const userId = await resetPassword(token, newPassword);

    const userId = 'user-id-from-token';

    // 성공 시 로그 기록
    await LogService.logPasswordResetSuccess(userId, email);

    return successResponse({ message: '비밀번호가 재설정되었습니다' });
  } catch (error) {
    // 실패 시 로그 기록
    const email = 'email-from-request';
    await LogService.logPasswordResetFailed(
      email,
      error instanceof Error ? error.message : '유효하지 않은 토큰'
    );

    return handleApiError(error);
  }
}
