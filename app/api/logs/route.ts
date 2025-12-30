/**
 * Logs API Routes
 *
 * GET /api/logs - 로그 목록 조회 (관리자)
 */

import { NextRequest } from 'next/server';
import { LogService } from '@/lib/server/services/log.service';
import { handleApiError, paginatedResponse, errorResponse } from '@/lib/server/utils/api-response';
import { isAdmin } from '@/lib/server/utils/supabase';

/**
 * 로그 목록 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return errorResponse('관리자 권한이 필요합니다', 403, 'UNAUTHORIZED');
    }

    const searchParams = request.nextUrl.searchParams;

    // 페이지네이션 파라미터
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    // 정렬 파라미터
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    // 필터 파라미터
    const eventCategory = searchParams.get('filter[event_category]') || undefined;
    const eventType = searchParams.get('filter[event_type]') || undefined;
    const severity = searchParams.get('filter[severity]') || undefined;
    const userId = searchParams.get('filter[user_id]') || undefined;
    const dateFrom = searchParams.get('filter[date_from]') || undefined;
    const dateTo = searchParams.get('filter[date_to]') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await LogService.getLogs({
      page,
      limit,
      sortBy: sortBy as 'created_at',
      order,
      eventCategory,
      eventType,
      severity: severity as any,
      userId,
      dateFrom,
      dateTo,
      search,
    });

    return paginatedResponse(result.logs, {
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
