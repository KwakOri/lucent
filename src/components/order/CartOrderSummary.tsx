/**
 * CartOrderSummary Component
 *
 * 장바구니 주문 요약 정보를 표시하는 컴포넌트
 */

'use client';

import type { CartItemWithProduct } from '@/lib/client/hooks/useCart';

interface CartOrderSummaryProps {
  items: CartItemWithProduct[];
  shippingFee?: number;
}

export function CartOrderSummary({
  items,
  shippingFee = 0,
}: CartOrderSummaryProps) {
  const productAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalAmount = productAmount + shippingFee;

  return (
    <aside className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 상품</h2>

      {/* Product List */}
      <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 max-h-[400px] overflow-y-auto">
        {items.map((item) => {
          const product = item.product;
          const imageUrl = product.main_image?.cdn_url || product.main_image?.public_url;

          return (
            <div key={item.id} className="flex gap-3">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.main_image?.alt_text || product.name}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">
                    {product.type === 'VOICE_PACK' ? '🎵' : '📦'}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-1">
                  {product.type === 'VOICE_PACK' ? '디지털 상품' : '실물 굿즈'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    {item.quantity}개
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {(product.price * item.quantity).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Summary */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">상품 금액 ({items.length}개)</span>
          <span className="text-gray-900">
            {productAmount.toLocaleString()}원
          </span>
        </div>

        {shippingFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">배송비</span>
            <span className="text-gray-900">
              {shippingFee.toLocaleString()}원
            </span>
          </div>
        )}

        <div className="pt-3 border-t-2 border-gray-900">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">
              총 결제 금액
            </span>
            <span className="text-xl font-bold text-primary-600">
              {totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
