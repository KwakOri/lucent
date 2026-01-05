/**
 * Cart Count API Route
 *
 * GET /api/cart/count - 장바구니 아이템 개수 조회
 */

import { NextRequest } from 'next/server';
import { CartService } from '@/lib/server/services/cart.service';
import {
  handleApiError,
  successResponse,
} from '@/lib/server/utils/api-response';
import { getCurrentUser } from '@/lib/server/utils/supabase';

/**
 * 장바구니 아이템 개수 조회
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return successResponse({ count: 0 });
    }

    const count = await CartService.getCartCount(user.id);

    return successResponse({ count });
  } catch (error) {
    return handleApiError(error);
  }
}
