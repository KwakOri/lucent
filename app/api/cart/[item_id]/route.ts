/**
 * Cart Item API Routes
 *
 * PATCH /api/cart/[item_id] - 장바구니 아이템 수량 변경
 * DELETE /api/cart/[item_id] - 장바구니 아이템 삭제
 */

import { NextRequest } from 'next/server';
import { CartService } from '@/lib/server/services/cart.service';
import {
  handleApiError,
  successResponse,
} from '@/lib/server/utils/api-response';
import { getCurrentUser } from '@/lib/server/utils/supabase';

interface RouteParams {
  params: Promise<{ item_id: string }>;
}

/**
 * 장바구니 아이템 수량 변경
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return handleApiError(new Error('로그인이 필요합니다'));
    }

    const { item_id } = await context.params;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity <= 0) {
      return handleApiError(new Error('올바른 수량을 입력해주세요'));
    }

    const item = await CartService.updateItemQuantity(
      user.id,
      item_id,
      quantity
    );

    return successResponse(item, '수량이 변경되었습니다');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 장바구니 아이템 삭제
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return handleApiError(new Error('로그인이 필요합니다'));
    }

    const { item_id } = await context.params;

    await CartService.removeItem(user.id, item_id);

    return successResponse(null, '장바구니에서 삭제되었습니다');
  } catch (error) {
    return handleApiError(error);
  }
}
