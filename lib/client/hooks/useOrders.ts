/**
 * Orders Hooks
 *
 * 주문 관련 React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrdersAPI, type CreateOrderData, type GetOrdersParams } from '@/lib/client/api/orders.api';
import { queryKeys } from './query-keys';

/**
 * 내 주문 목록 조회 Hook
 */
export function useOrders(params?: GetOrdersParams) {
  return useQuery({
    queryKey: queryKeys.orders.list(params || {}),
    queryFn: () => OrdersAPI.getMyOrders(params),
    staleTime: 1000 * 60 * 3, // 3분
  });
}

/**
 * 주문 단일 조회 Hook
 */
export function useOrder(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id || ''),
    queryFn: () => OrdersAPI.getOrder(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 주문 생성 Hook
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderData) => OrdersAPI.createOrder(data),
    onSuccess: () => {
      // 주문 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(),
      });
    },
  });
}

/**
 * 디지털 상품 다운로드 URL 생성 Hook
 */
export function useDownloadDigitalProduct() {
  return useMutation({
    mutationFn: (orderItemId: string) => OrdersAPI.getDownloadUrl(orderItemId),
  });
}
