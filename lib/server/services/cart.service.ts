/**
 * Cart Service
 *
 * 장바구니 관련 비즈니스 로직
 * - 장바구니 조회
 * - 장바구니 아이템 추가/수정/삭제
 * - 장바구니 비우기
 */

import { createServerClient } from '@/lib/server/utils/supabase';
import { ApiError, NotFoundError } from '@/lib/server/utils/errors';
import { Tables, TablesInsert, TablesUpdate } from '@/types/database';

type CartItem = Tables<'cart_items'>;
type CartItemInsert = TablesInsert<'cart_items'>;
type CartItemUpdate = TablesUpdate<'cart_items'>;

export interface CartItemWithProduct extends CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    type: 'VOICE_PACK' | 'PHYSICAL_GOODS' | 'BUNDLE';
    stock: number | null;
    is_active: boolean;
    main_image?: {
      id: string;
      public_url: string;
      cdn_url: string | null;
      alt_text: string | null;
    } | null;
  } | null;
}

export class CartService {
  /**
   * 사용자의 장바구니 조회
   */
  static async getCart(userId: string): Promise<CartItemWithProduct[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('cart_items')
      .select(
        `
        *,
        product:products (
          id,
          name,
          price,
          type,
          stock,
          is_active,
          main_image:images!products_main_image_id_fkey (
            id,
            public_url,
            cdn_url,
            alt_text
          )
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(`장바구니 조회 실패: ${error.message}`, 500);
    }

    return data as CartItemWithProduct[];
  }

  /**
   * 장바구니에 아이템 추가
   */
  static async addItem(
    userId: string,
    productId: string,
    quantity: number = 1
  ): Promise<CartItemWithProduct> {
    const supabase = await createServerClient();

    // 1. 상품 확인
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price, type, stock, is_active')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new NotFoundError('상품을 찾을 수 없습니다');
    }

    if (!product.is_active) {
      throw new ApiError('판매 중단된 상품입니다', 400);
    }

    // 2. 재고 확인 (실물 상품인 경우)
    if (product.type === 'PHYSICAL_GOODS' && product.stock !== null) {
      if (product.stock <= 0) {
        throw new ApiError('품절된 상품입니다', 400);
      }
      if (quantity > product.stock) {
        throw new ApiError(`재고가 부족합니다 (남은 재고: ${product.stock}개)`, 400);
      }
    }

    // 3. 이미 장바구니에 있는지 확인
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new ApiError(`장바구니 확인 실패: ${checkError.message}`, 500);
    }

    // 4. 이미 있으면 수량 업데이트, 없으면 새로 추가
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      // 재고 확인
      if (product.type === 'PHYSICAL_GOODS' && product.stock !== null) {
        if (newQuantity > product.stock) {
          throw new ApiError(
            `재고가 부족합니다 (남은 재고: ${product.stock}개)`,
            400
          );
        }
      }

      return this.updateItemQuantity(userId, existingItem.id, newQuantity);
    } else {
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity,
        })
        .select(
          `
          *,
          product:products (
            id,
            name,
            price,
            type,
            stock,
            is_active,
            main_image:images!products_main_image_id_fkey (
              id,
              public_url,
              cdn_url,
              alt_text
            )
          )
        `
        )
        .single();

      if (insertError) {
        throw new ApiError(`장바구니 추가 실패: ${insertError.message}`, 500);
      }

      return newItem as CartItemWithProduct;
    }
  }

  /**
   * 장바구니 아이템 수량 변경
   */
  static async updateItemQuantity(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<CartItemWithProduct> {
    const supabase = await createServerClient();

    if (quantity <= 0) {
      throw new ApiError('수량은 1개 이상이어야 합니다', 400);
    }

    // 1. 아이템 확인
    const { data: item, error: itemError } = await supabase
      .from('cart_items')
      .select(
        `
        *,
        product:products (
          id,
          name,
          price,
          type,
          stock,
          is_active
        )
      `
      )
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (itemError || !item) {
      throw new NotFoundError('장바구니 아이템을 찾을 수 없습니다');
    }

    // 2. 재고 확인
    const product = item.product;
    if (
      product &&
      product.type === 'PHYSICAL_GOODS' &&
      product.stock !== null
    ) {
      if (quantity > product.stock) {
        throw new ApiError(
          `재고가 부족합니다 (남은 재고: ${product.stock}개)`,
          400
        );
      }
    }

    // 3. 수량 업데이트
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .eq('user_id', userId)
      .select(
        `
        *,
        product:products (
          id,
          name,
          price,
          type,
          stock,
          is_active,
          main_image:images!products_main_image_id_fkey (
            id,
            public_url,
            cdn_url,
            alt_text
          )
        )
      `
      )
      .single();

    if (updateError) {
      throw new ApiError(`수량 변경 실패: ${updateError.message}`, 500);
    }

    return updatedItem as CartItemWithProduct;
  }

  /**
   * 장바구니 아이템 삭제
   */
  static async removeItem(userId: string, itemId: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) {
      throw new ApiError(`장바구니 아이템 삭제 실패: ${error.message}`, 500);
    }
  }

  /**
   * 장바구니 비우기
   */
  static async clearCart(userId: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new ApiError(`장바구니 비우기 실패: ${error.message}`, 500);
    }
  }

  /**
   * 장바구니 아이템 개수 조회
   */
  static async getCartCount(userId: string): Promise<number> {
    const supabase = await createServerClient();

    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw new ApiError(`장바구니 개수 조회 실패: ${error.message}`, 500);
    }

    return count || 0;
  }
}
