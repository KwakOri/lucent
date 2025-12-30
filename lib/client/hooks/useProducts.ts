/**
 * Products Hooks
 *
 * 상품 관련 React Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { ProductsAPI, type GetProductsParams } from '@/lib/client/api/products.api';
import { queryKeys } from './query-keys';

/**
 * 상품 목록 조회 Hook
 */
export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params || {}),
    queryFn: () => ProductsAPI.getProducts(params),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 상품 단일 조회 Hook (ID)
 */
export function useProduct(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(id || ''),
    queryFn: () => ProductsAPI.getProduct(id!),
    enabled: !!id, // id가 있을 때만 실행
    staleTime: 1000 * 60 * 10, // 10분
  });
}

/**
 * 상품 단일 조회 Hook (Slug)
 */
export function useProductBySlug(slug: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.products.bySlug(slug || ''),
    queryFn: () => ProductsAPI.getProductBySlug(slug!),
    enabled: !!slug, // slug가 있을 때만 실행
    staleTime: 1000 * 60 * 10, // 10분
  });
}
