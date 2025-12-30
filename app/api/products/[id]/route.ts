/**
 * Product Detail API Routes
 *
 * GET /api/products/:id - 상품 상세 조회
 * PATCH /api/products/:id - 상품 수정 (관리자)
 * DELETE /api/products/:id - 상품 삭제 (관리자)
 */

import { NextRequest } from 'next/server';
import { ProductService } from '@/lib/server/services/product.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';
import { isAdmin } from '@/lib/server/utils/supabase';
import type { UpdateProductRequest } from '@/types/api';

/**
 * 상품 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await ProductService.getProductById(params.id);

    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 상품 수정 (관리자)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return handleApiError(
        new Error('관리자 권한이 필요합니다')
      );
    }

    const body = await request.json() as UpdateProductRequest;
    const adminId = 'admin-id'; // TODO: 실제 관리자 ID

    const product = await ProductService.updateProduct(
      params.id,
      body,
      adminId
    );

    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 상품 삭제 (관리자)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return handleApiError(
        new Error('관리자 권한이 필요합니다')
      );
    }

    const adminId = 'admin-id'; // TODO: 실제 관리자 ID

    await ProductService.deleteProduct(params.id, adminId);

    return successResponse({ message: '상품이 삭제되었습니다' });
  } catch (error) {
    return handleApiError(error);
  }
}
