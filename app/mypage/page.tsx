'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Download, LogOut, Package } from 'lucide-react';

// Order status types
type OrderStatus = 'PENDING' | 'PAID' | 'MAKING' | 'SHIPPING' | 'DONE';

// Order status config
const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' }
> = {
  PENDING: { label: '입금대기', variant: 'warning' },
  PAID: { label: '입금확인', variant: 'default' },
  MAKING: { label: '제작중', variant: 'warning' },
  SHIPPING: { label: '발송중', variant: 'success' },
  DONE: { label: '배송완료', variant: 'default' },
};

// Temporary mock data
const MOCK_ORDERS = [
  {
    id: '1',
    orderNumber: 'ORD-20250101-001',
    createdAt: '2025-01-01T10:00:00Z',
    status: 'PAID' as OrderStatus,
    totalPrice: 10000,
    items: [
      {
        id: '1',
        productId: '1',
        productName: '미루루 일상 보이스팩',
        productType: 'VOICE_PACK' as const,
        quantity: 1,
        price: 5000,
        digitalFileUrl: '/downloads/voice-pack-1.zip',
      },
      {
        id: '2',
        productId: '2',
        productName: '미루루 감정 보이스팩',
        productType: 'VOICE_PACK' as const,
        quantity: 1,
        price: 5000,
        digitalFileUrl: '/downloads/voice-pack-2.zip',
      },
    ],
  },
  {
    id: '2',
    orderNumber: 'ORD-20250102-002',
    createdAt: '2025-01-02T14:00:00Z',
    status: 'PENDING' as OrderStatus,
    totalPrice: 15000,
    items: [
      {
        id: '3',
        productId: '3',
        productName: '미루루 아크릴 스탠드',
        productType: 'PHYSICAL_GOODS' as const,
        quantity: 1,
        price: 15000,
      },
    ],
    shippingAddress: '서울시 강남구 테헤란로 123',
  },
];

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [orders, setOrders] = useState<typeof MOCK_ORDERS>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Check authentication
    const loadUserAndOrders = async () => {
      try {
        setIsLoading(true);

        // TODO: Replace with actual API calls
        // const userResponse = await fetch('/api/auth/me');
        // const ordersResponse = await fetch('/api/orders');

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        setUser({ email: 'user@example.com' });
        setOrders(MOCK_ORDERS);
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAndOrders();
  }, []);

  const handleLogout = async () => {
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleDownload = async (orderId: string, itemId: string, productName: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/orders/${orderId}/download/${itemId}`);
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `${productName}.zip`;
      // a.click();

      console.log('Download:', orderId, itemId, productName);
      alert(`${productName} 다운로드가 시작되었습니다`);
    } catch (err) {
      console.error('Download failed:', err);
      alert('다운로드 중 오류가 발생했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <EmptyState title="오류가 발생했습니다" description={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">
              마이페이지
            </h1>
            <p className="text-lg text-text-secondary">
              {user?.email}
            </p>
          </div>
          <Button
            intent="secondary"
            size="md"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>

        {/* Order List Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            주문 내역
          </h2>

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12">
              <EmptyState
                title="아직 주문 내역이 없습니다"
                description="굿즈샵에서 마음에 드는 상품을 찾아보세요"
              >
                <Link href="/goods">
                  <Button intent="primary" size="md">
                    <Package className="w-4 h-4" />
                    굿즈샵 보러가기
                  </Button>
                </Link>
              </EmptyState>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-200">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        주문번호: {order.orderNumber}
                      </p>
                      <p className="text-sm text-text-muted">
                        {new Date(order.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge variant={ORDER_STATUS_CONFIG[order.status].variant}>
                      {ORDER_STATUS_CONFIG[order.status].label}
                    </Badge>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="text-base font-medium text-text-primary">
                            {item.productName}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {item.quantity}개 × {item.price.toLocaleString()}원
                          </p>
                        </div>

                        {/* Download Button for Digital Products */}
                        {item.productType === 'VOICE_PACK' &&
                          order.status !== 'PENDING' &&
                          item.digitalFileUrl && (
                            <Button
                              intent="primary"
                              size="sm"
                              onClick={() =>
                                handleDownload(order.id, item.id, item.productName)
                              }
                            >
                              <Download className="w-4 h-4" />
                              다운로드
                            </Button>
                          )}
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
                    <div>
                      {order.shippingAddress && (
                        <p className="text-sm text-text-secondary">
                          배송지: {order.shippingAddress}
                        </p>
                      )}
                    </div>
                    <p className="text-xl font-bold text-primary-700">
                      총 {order.totalPrice.toLocaleString()}원
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Digital Products Section */}
        {orders.some((order) =>
          order.items.some((item) => item.productType === 'VOICE_PACK')
        ) && (
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              디지털 상품
            </h2>

            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="space-y-4">
                {orders
                  .filter((order) => order.status !== 'PENDING')
                  .flatMap((order) =>
                    order.items
                      .filter((item) => item.productType === 'VOICE_PACK')
                      .map((item) => (
                        <div
                          key={`${order.id}-${item.id}`}
                          className="flex items-center justify-between p-4 rounded-lg bg-neutral-50"
                        >
                          <div>
                            <p className="font-medium text-text-primary">
                              {item.productName}
                            </p>
                            <p className="text-sm text-text-secondary">
                              구매일:{' '}
                              {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          {item.digitalFileUrl && (
                            <Button
                              intent="primary"
                              size="sm"
                              onClick={() =>
                                handleDownload(order.id, item.id, item.productName)
                              }
                            >
                              <Download className="w-4 h-4" />
                              다운로드
                            </Button>
                          )}
                        </div>
                      ))
                  )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
