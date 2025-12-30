/**
 * GET /api/images/:id - 이미지 상세 조회
 * DELETE /api/images/:id - 이미지 삭제 (Soft Delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ImageService } from '@/lib/server/services/image.service';
import { getCurrentUser } from '@/lib/server/utils/supabase';
import { handleApiError, successResponse, errorResponse } from '@/lib/server/utils/api-response';

/**
 * GET /api/images/:id
 * 이미지 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('로그인이 필요합니다', 401, 'UNAUTHENTICATED');
    }

    // 2. 이미지 조회
    const image = await ImageService.getImageById(id);

    return successResponse(image);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/images/:id
 * 이미지 삭제 (Soft Delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('로그인이 필요합니다', 401, 'UNAUTHENTICATED');
    }

    // TODO: 관리자 권한 확인
    // if (!user.isAdmin) {
    //   return errorResponse('관리자 권한이 필요합니다', 403, 'ADMIN_REQUIRED');
    // }

    // 2. 이미지 삭제 (Soft Delete)
    await ImageService.deleteImage(id, user.id);

    return successResponse({ message: '이미지가 비활성화되었습니다' });
  } catch (error) {
    return handleApiError(error);
  }
}
