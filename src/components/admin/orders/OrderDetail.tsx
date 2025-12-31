'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  recipient_name?: string;
  recipient_phone?: string;
  shipping_address?: string;
  shipping_memo?: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    product: {
      id: string;
      name: string;
      type: string;
      slug: string;
      main_image: {
        public_url: string;
        cdn_url?: string;
      } | null;
    } | null;
  }>;
}

interface OrderDetailProps {
  order: Order;
}

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: '입금대기',
  PAID: '결제완료',
  PREPARING: '준비중',
  SHIPPED: '배송중',
  DELIVERED: '배송완료',
  CANCELLED: '취소됨',
};

const typeLabels: Record<string, string> = {
  VOICE_PACK: '디지털 상품',
  PHYSICAL_GOODS: '실물 상품',
};

export function OrderDetail({ order: initialOrder }: OrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async () => {
    if (selectedStatus === order.status) {
      alert('변경할 상태를 선택해주세요');
      return;
    }

    if (!confirm(`주문 상태를 "${statusLabels[selectedStatus]}"(으)로 변경하시겠습니까?`)) {
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!response.ok) {
        throw new Error('상태 변경 실패');
      }

      const { data } = await response.json();
      setOrder({ ...order, status: data.status });
      router.refresh();
      alert('주문 상태가 변경되었습니다');
    } catch (error) {
      alert('주문 상태 변경에 실패했습니다');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/orders"
          className="text-sm text-blue-600 hover:text-blue-900 mb-4 inline-block"
        >
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">주문 상세</h1>
      </div>

      {/* Order Info Card */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Order Number and Status */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">주문번호: {order.order_number}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  주문일: {new Date(order.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleStatusChange}
                  disabled={isUpdating}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                >
                  {isUpdating ? '변경 중...' : '상태 변경'}
                </button>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">고객 정보</h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">이름</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.buyer_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">이메일</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.buyer_email}</dd>
                </div>
                {order.buyer_phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">전화번호</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.buyer_phone}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Shipping Info (if exists) */}
            {order.shipping_address && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">배송 정보</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  {order.recipient_name && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">수령인</dt>
                      <dd className="mt-1 text-sm text-gray-900">{order.recipient_name}</dd>
                    </div>
                  )}
                  {order.recipient_phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">연락처</dt>
                      <dd className="mt-1 text-sm text-gray-900">{order.recipient_phone}</dd>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">주소</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.shipping_address}</dd>
                  </div>
                  {order.shipping_memo && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">배송 메모</dt>
                      <dd className="mt-1 text-sm text-gray-900">{order.shipping_memo}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">주문 상품</h4>
              <ul className="divide-y divide-gray-200 border-t border-b border-gray-200">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex py-4">
                    {item.product?.main_image && (
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.product.main_image.cdn_url || item.product.main_image.public_url}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-sm font-medium text-gray-900">
                          <h5>{item.product?.name}</h5>
                          <p className="ml-4">{(item.unit_price * item.quantity).toLocaleString()}원</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {typeLabels[item.product?.type || '']} • {item.unit_price.toLocaleString()}원 × {item.quantity}개
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Total */}
              <div className="mt-4 flex justify-end">
                <div className="text-right">
                  <dt className="text-sm font-medium text-gray-500">총 금액</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">
                    {order.total_amount.toLocaleString()}원
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
