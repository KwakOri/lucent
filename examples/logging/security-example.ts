/**
 * 보안 이벤트 로깅 적용 예시
 *
 * 이 파일은 보안 관련 이벤트를 로깅하는 예시 코드입니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LogService } from '@/lib/server/services/log.service';
import { getCurrentUser } from '@/lib/server/utils/supabase';

// ===== 권한 없는 API 접근 로깅 예시 =====

/**
 * API 미들웨어 또는 각 라우트에서 사용
 */
export async function logUnauthorizedAccessExample(request: NextRequest) {
  const user = await getCurrentUser();

  // 권한 체크 (예: 관리자 전용 API)
  const isAdmin = false; // 실제로는 user role 확인

  if (!isAdmin) {
    // 권한 없는 접근 로그
    await LogService.logUnauthorizedAccess(
      user?.id || null,
      request.nextUrl.pathname,
      request.ip,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(
      { status: 'error', message: '권한이 없습니다' },
      { status: 403 }
    );
  }

  // 권한이 있으면 계속 진행
  return NextResponse.next();
}

// ===== Rate Limiting 로깅 예시 =====

/**
 * Rate Limiter와 함께 사용
 */
export async function logRateLimitExample(request: NextRequest) {
  const user = await getCurrentUser();
  const identifier = user?.id || request.ip || 'unknown';

  // TODO: Rate Limiter 체크
  // const limiter = new RateLimiter();
  // const isAllowed = await limiter.check(identifier, request.nextUrl.pathname);

  const isAllowed = false; // 제한 초과했다고 가정

  if (!isAllowed) {
    // API 호출 제한 초과 로그
    await LogService.logRateLimitExceeded(
      user?.id || null,
      request.nextUrl.pathname,
      request.ip
    );

    return NextResponse.json(
      {
        status: 'error',
        message: 'API 호출 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

// ===== 의심스러운 활동 감지 예시 =====

/**
 * 연속된 로그인 실패 감지
 */
export async function detectSuspiciousLoginAttemptsExample(
  request: NextRequest,
  email: string
) {
  // TODO: 최근 N분 내 로그인 실패 횟수 조회
  // const recentFailures = await LogService.getLogs({
  //   eventType: 'user.login.failed',
  //   metadata: { email },
  //   dateFrom: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15분 전
  // });

  const recentFailures = { total: 5 }; // 5회 실패했다고 가정

  if (recentFailures.total >= 5) {
    // 의심스러운 활동 로그
    await LogService.logSuspiciousActivity(
      null, // 아직 로그인 전이므로 userId 없음
      `연속 로그인 실패 시도 (${recentFailures.total}회)`,
      request.ip,
      {
        email,
        failureCount: recentFailures.total,
        timeWindow: '15분',
      }
    );

    // 추가 보안 조치 (계정 잠금, CAPTCHA 등)
    return NextResponse.json(
      {
        status: 'error',
        message: '보안을 위해 계정이 일시적으로 잠겼습니다. 15분 후 다시 시도해주세요.',
        requiresCaptcha: true,
      },
      { status: 429 }
    );
  }

  return null; // 정상
}

/**
 * 비정상적인 다운로드 패턴 감지
 */
export async function detectAbnormalDownloadPatternExample(
  userId: string,
  productId: string
) {
  // TODO: 최근 짧은 시간 내 과도한 다운로드 시도 감지
  // const recentDownloads = await LogService.getLogs({
  //   eventType: 'digital_product.download',
  //   userId,
  //   resourceId: productId,
  //   dateFrom: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5분 전
  // });

  const recentDownloads = { total: 10 }; // 5분 내 10회 다운로드

  if (recentDownloads.total >= 10) {
    // 의심스러운 활동 로그
    await LogService.logSuspiciousActivity(
      userId,
      `비정상적인 다운로드 패턴 감지 (5분 내 ${recentDownloads.total}회)`,
      undefined,
      {
        productId,
        downloadCount: recentDownloads.total,
        timeWindow: '5분',
      }
    );

    // 추가 조치 (다운로드 일시 중단 등)
    return {
      blocked: true,
      message: '비정상적인 다운로드 패턴이 감지되었습니다. 고객센터에 문의해주세요.',
    };
  }

  return { blocked: false };
}

/**
 * IP 기반 의심 활동 감지
 */
export async function detectSuspiciousIPActivityExample(
  request: NextRequest,
  activityType: string
) {
  const ipAddress = request.ip;

  // TODO: 동일 IP에서 다양한 계정으로 로그인 시도 등 감지
  // const recentActivities = await LogService.getLogs({
  //   eventType: activityType,
  //   ipAddress,
  //   dateFrom: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30분 전
  // });

  const uniqueUsers = new Set(['user1', 'user2', 'user3', 'user4', 'user5']);

  if (uniqueUsers.size >= 5) {
    // 의심스러운 활동 로그
    await LogService.logSuspiciousActivity(
      null,
      `동일 IP에서 다수 계정 활동 감지 (${uniqueUsers.size}개 계정)`,
      ipAddress,
      {
        activityType,
        accountCount: uniqueUsers.size,
        timeWindow: '30분',
      }
    );

    // IP 차단 등의 조치 고려
    return {
      blocked: true,
      message: '보안상의 이유로 일시적으로 차단되었습니다.',
    };
  }

  return { blocked: false };
}

// ===== 미들웨어에서 보안 로깅 통합 예시 =====

/**
 * Next.js 미들웨어에서 사용
 * middleware.ts 파일에서 활용
 */
export async function securityMiddlewareExample(request: NextRequest) {
  const user = await getCurrentUser();
  const pathname = request.nextUrl.pathname;

  // 1. Rate Limiting 체크
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = await logRateLimitExample(request);
    if (rateLimitResult) return rateLimitResult;
  }

  // 2. 관리자 전용 경로 체크
  if (pathname.startsWith('/api/admin/')) {
    const authResult = await logUnauthorizedAccessExample(request);
    if (authResult) return authResult;
  }

  // 3. 다운로드 패턴 체크 (다운로드 API인 경우)
  if (pathname.includes('/download/') && user) {
    const productId = 'extracted-from-pathname'; // 실제로는 경로에서 추출
    const downloadCheck = await detectAbnormalDownloadPatternExample(user.id, productId);
    if (downloadCheck.blocked) {
      return NextResponse.json(
        { status: 'error', message: downloadCheck.message },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}
