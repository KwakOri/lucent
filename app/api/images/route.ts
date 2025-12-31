/**
 * GET /api/images
 *
 * 이미지 목록 조회 (관리자 전용)
 * - 페이지네이션
 * - 필터링 (image_type, is_active)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ImageService } from '@/lib/server/services/image.service';
import { getCurrentUser, isAdmin } from '@/lib/server/utils/supabase';
import { handleApiError, successResponse, errorResponse } from '@/lib/server/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('로그인이 필요합니다', 401, 'UNAUTHENTICATED');
    }

    // 2. 관리자 권한 확인
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return errorResponse('관리자 권한이 필요합니다', 403, 'ADMIN_REQUIRED');
    }

    // 3. Query Parameters 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const imageType = searchParams.get('image_type') || undefined;
    const isActiveParam = searchParams.get('is_active');
    const isActive = isActiveParam ? isActiveParam === 'true' : undefined;

    // 4. 이미지 목록 조회
    const result = await ImageService.getImages({
      page,
      limit,
      imageType,
      isActive,
    });

    return successResponse({
      images: result.images,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
