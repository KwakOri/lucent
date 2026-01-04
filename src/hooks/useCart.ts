/**
 * Cart API Hooks
 *
 * 장바구니 관련 React Query hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/types';
import type { CartItemWithProduct } from '@/lib/server/services/cart.service';

interface CartResponse {
  items: CartItemWithProduct[];
  count: number;
  totalPrice: number;
}

interface AddToCartRequest {
  product_id: string;
  quantity?: number;
}

interface UpdateCartItemRequest {
  item_id: string;
  quantity: number;
}

/**
 * 장바구니 조회 Hook
 *
 * @example
 * const { data, isLoading } = useCart();
 */
export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await fetch('/api/cart');
      if (!response.ok) {
        throw new Error('장바구니 조회 실패');
      }
      const data: ApiResponse<CartResponse> = await response.json();
      return data.data;
    },
    staleTime: 1000 * 30, // 30초
  });
}

/**
 * 장바구니 아이템 개수 조회 Hook
 *
 * @example
 * const { data: count } = useCartCount();
 */
export function useCartCount() {
  return useQuery({
    queryKey: ['cart', 'count'],
    queryFn: async () => {
      const response = await fetch('/api/cart/count');
      if (!response.ok) {
        throw new Error('장바구니 개수 조회 실패');
      }
      const data: ApiResponse<{ count: number }> = await response.json();
      return data.data?.count || 0;
    },
    staleTime: 1000 * 30, // 30초
  });
}

/**
 * 장바구니에 상품 추가 Hook
 *
 * @example
 * const addToCart = useAddToCart();
 * addToCart.mutate({ product_id: 'product-id', quantity: 1 });
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AddToCartRequest) => {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '장바구니 추가 실패');
      }

      const data: ApiResponse<CartItemWithProduct> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart', 'count'] });
    },
  });
}

/**
 * 장바구니 아이템 수량 변경 Hook
 *
 * @example
 * const updateCartItem = useUpdateCartItem();
 * updateCartItem.mutate({ item_id: 'item-id', quantity: 2 });
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item_id, quantity }: UpdateCartItemRequest) => {
      const response = await fetch(`/api/cart/${item_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '수량 변경 실패');
      }

      const data: ApiResponse<CartItemWithProduct> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

/**
 * 장바구니 아이템 삭제 Hook
 *
 * @example
 * const removeCartItem = useRemoveCartItem();
 * removeCartItem.mutate('item-id');
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '삭제 실패');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart', 'count'] });
    },
  });
}

/**
 * 장바구니 비우기 Hook
 *
 * @example
 * const clearCart = useClearCart();
 * clearCart.mutate();
 */
export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '장바구니 비우기 실패');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart', 'count'] });
    },
  });
}
