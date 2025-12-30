/**
 * Log Detail API Routes
 *
 * GET /api/logs/:id - 로그 단일 조회 (관리자)
 */

import { NextRequest } from 'next/server';
import { LogService } from '@/lib/server/services/log.service';
import { handleApiError, successResponse, errorResponse } from '@/lib/server/utils/api-response';
import { isAdmin } from '@/lib/server/utils/supabase';

/**
 * 로그 단일 조회 (관리자 전용)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 관리자 권한 확인
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return errorResponse('관리자 권한이 필요합니다', 403, 'UNAUTHORIZED');
    }

    const log = await LogService.getLogById(params.id);

    if (!log) {
      return errorResponse('로그를 찾을 수 없습니다', 404, 'LOG_NOT_FOUND');
    }

    return successResponse(log);
  } catch (error) {
    return handleApiError(error);
  }
}
