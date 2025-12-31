/**
 * Products API Routes
 *
 * GET /api/products - 상품 목록 조회
 * POST /api/products - 상품 생성 (관리자)
 */

import { NextRequest } from 'next/server';
import { ProductService } from '@/lib/server/services/product.service';
import { handleApiError, paginatedResponse, successResponse } from '@/lib/server/utils/api-response';
import { isAdmin } from '@/lib/server/utils/supabase';
import type { CreateProductRequest, GetProductsQuery } from '@/types/api';
import type { Enums } from '@/types/database';

/**
 * 상품 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const artistId = searchParams.get('artistId') || undefined;
    const type = searchParams.get('type') as Enums<'product_type'> | undefined;
    const isActive = searchParams.get('isActive') === 'false' ? false : true;
    const sortBy = (searchParams.get('sortBy') || 'created_at') as 'created_at' | 'price' | 'name';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    const result = await ProductService.getProducts({
      page,
      limit,
      artistId,
      type,
      isActive,
      sortBy,
      order,
    });

    return paginatedResponse(result.products, {
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 상품 생성 (관리자)
 */
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return handleApiError(
        new Error('관리자 권한이 필요합니다')
      );
    }

    const body = await request.json() as CreateProductRequest;

    // TODO: 관리자 ID 가져오기
    const adminId = 'admin-id';

    // 빈 문자열을 null로 변환
    const productData = {
      ...body,
      main_image_id: body.main_image_id || null,
    };

    const product = await ProductService.createProduct(productData, adminId);

    return successResponse(product, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
