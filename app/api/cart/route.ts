/**
 * Cart API Routes
 *
 * GET /api/cart - 장바구니 조회
 * POST /api/cart - 장바구니에 상품 추가
 * DELETE /api/cart - 장바구니 비우기
 */

import { NextRequest } from 'next/server';
import { CartService } from '@/lib/server/services/cart.service';
import {
  handleApiError,
  successResponse,
} from '@/lib/server/utils/api-response';
import { getCurrentUser } from '@/lib/server/utils/supabase';

/**
 * 장바구니 조회
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return handleApiError(new Error('로그인이 필요합니다'));
    }

    const items = await CartService.getCart(user.id);

    return successResponse({
      items,
      count: items.length,
      totalPrice: items.reduce(
        (sum, item) => sum + (item.product?.price || 0) * item.quantity,
        0
      ),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 장바구니에 상품 추가
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return handleApiError(new Error('로그인이 필요합니다'));
    }

    const body = await request.json();
    const { product_id, quantity = 1 } = body;

    if (!product_id) {
      return handleApiError(new Error('상품 ID가 필요합니다'));
    }

    const item = await CartService.addItem(user.id, product_id, quantity);

    return successResponse(item, '장바구니에 추가되었습니다', 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 장바구니 비우기
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return handleApiError(new Error('로그인이 필요합니다'));
    }

    await CartService.clearCart(user.id);

    return successResponse(null, '장바구니가 비워졌습니다');
  } catch (error) {
    return handleApiError(error);
  }
}
