/**
 * Log Statistics API Routes
 *
 * GET /api/logs/stats - 로그 통계 조회 (관리자)
 */

import { NextRequest } from 'next/server';
import { LogService } from '@/lib/server/services/log.service';
import { handleApiError, successResponse, errorResponse } from '@/lib/server/utils/api-response';
import { isAdmin } from '@/lib/server/utils/supabase';

/**
 * 로그 통계 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return errorResponse('관리자 권한이 필요합니다', 403, 'UNAUTHORIZED');
    }

    const searchParams = request.nextUrl.searchParams;

    const dateFrom = searchParams.get('date_from') || undefined;
    const dateTo = searchParams.get('date_to') || undefined;

    const stats = await LogService.getStats({
      dateFrom,
      dateTo,
    });

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
