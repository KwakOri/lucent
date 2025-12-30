'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Play, Pause, ShoppingCart } from 'lucide-react';

// Temporary mock data - will be replaced with API calls
const MOCK_VOICE_PACKS = [
  {
    id: '1',
    title: '미루루 일상 보이스팩',
    description: '일상에서 사용할 수 있는 다양한 보이스',
    price: 5000,
    thumbnail: '/images/voice-pack-1.jpg',
    sampleAudioUrl: '/audio/sample-1.mp3',
    isActive: true,
  },
  {
    id: '2',
    title: '미루루 감정 보이스팩',
    description: '다양한 감정을 담은 보이스',
    price: 5000,
    thumbnail: '/images/voice-pack-2.jpg',
    sampleAudioUrl: '/audio/sample-2.mp3',
    isActive: true,
  },
];

const MOCK_PHYSICAL_GOODS = [
  {
    id: '1',
    name: '미루루 아크릴 스탠드',
    description: '귀여운 미루루 아크릴 스탠드',
    price: 15000,
    images: ['/images/goods-1.jpg'],
    isActive: true,
  },
];

export default function MiruruGoodsShopPage() {
  const router = useRouter();
  const [voicePacks, setVoicePacks] = useState<typeof MOCK_VOICE_PACKS>([]);
  const [physicalGoods, setPhysicalGoods] = useState<typeof MOCK_PHYSICAL_GOODS>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch('/api/products?artistId=miruru');
        // const data = await response.json();

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        setVoicePacks(MOCK_VOICE_PACKS);
        setPhysicalGoods(MOCK_PHYSICAL_GOODS);
      } catch (err) {
        setError('상품을 불러오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handlePlaySample = (audioUrl: string, packId: string) => {
    // TODO: Implement audio player
    if (currentPlaying === packId) {
      setCurrentPlaying(null);
    } else {
      setCurrentPlaying(packId);
      console.log('Play sample:', audioUrl);
    }
  };

  const handlePurchase = (productId: string, productType: 'voice' | 'physical') => {
    // TODO: Check login status and redirect to order page
    console.log('Purchase:', productId, productType);
    router.push(`/order/${productId}`);
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
        <EmptyState
          title="오류가 발생했습니다"
          description={error}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E3F2FD] to-neutral-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#E3F2FD] to-[#A8D5E2] py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center">
              <span className="text-6xl">🌸</span>
            </div>
            <h1 className="text-5xl font-bold text-text-primary mb-4">
              미루루 굿즈샵
            </h1>
            <p className="text-xl text-text-secondary mb-8">
              포근하고 다정한 동물의 숲에 오신 것을 환영합니다
            </p>
          </div>
        </div>
      </section>

      {/* Voice Packs Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-3">
              Voice Packs
            </h2>
            <p className="text-lg text-text-secondary">
              미루루의 다양한 보이스팩을 만나보세요
            </p>
          </div>

          {voicePacks.length === 0 ? (
            <EmptyState
              title="준비 중입니다"
              description="곧 멋진 보이스팩을 만나보실 수 있어요"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {voicePacks.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-white rounded-2xl border-2 border-[#A8D5E2] overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {/* CD Cover Style Thumbnail */}
                  <div className="aspect-square bg-gradient-to-br from-[#E3F2FD] to-[#A8D5E2] relative flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#A8D5E2] to-[#E3F2FD] flex items-center justify-center">
                        <span className="text-4xl">🎵</span>
                      </div>
                    </div>
                  </div>

                  {/* Pack Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-text-primary mb-2">
                      {pack.title}
                    </h3>
                    <p className="text-sm text-text-secondary mb-4">
                      {pack.description}
                    </p>
                    <p className="text-2xl font-bold text-primary-700 mb-4">
                      {pack.price.toLocaleString()}원
                    </p>

                    {/* Sample Play Button */}
                    <div className="flex gap-3 mb-4">
                      <Button
                        intent="secondary"
                        size="md"
                        fullWidth
                        onClick={() => handlePlaySample(pack.sampleAudioUrl, pack.id)}
                      >
                        {currentPlaying === pack.id ? (
                          <>
                            <Pause className="w-4 h-4" />
                            일시정지
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            샘플 듣기
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Purchase Button */}
                    <Button
                      intent="primary"
                      size="md"
                      fullWidth
                      onClick={() => handlePurchase(pack.id, 'voice')}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      구매하기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Physical Goods Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-3">
              Goods
            </h2>
            <p className="text-lg text-text-secondary">
              미루루와 함께하는 실물 굿즈
            </p>
          </div>

          {physicalGoods.length === 0 ? (
            <EmptyState
              title="준비 중입니다"
              description="곧 다양한 굿즈를 만나보실 수 있어요"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {physicalGoods.map((goods) => (
                <div
                  key={goods.id}
                  className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {/* Goods Image */}
                  <div className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 relative flex items-center justify-center">
                    <span className="text-6xl">📦</span>
                  </div>

                  {/* Goods Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-text-primary mb-2">
                      {goods.name}
                    </h3>
                    <p className="text-sm text-text-secondary mb-4">
                      {goods.description}
                    </p>
                    <p className="text-2xl font-bold text-primary-700 mb-4">
                      {goods.price.toLocaleString()}원
                    </p>

                    {/* Purchase Button */}
                    <Button
                      intent="primary"
                      size="md"
                      fullWidth
                      onClick={() => handlePurchase(goods.id, 'physical')}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      구매하기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Shop Info Section */}
      <section className="py-16 px-4 bg-neutral-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">
            구매 안내
          </h2>

          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 border border-neutral-200">
              <h3 className="text-lg font-bold text-text-primary mb-3">
                배송 정책
              </h3>
              <p className="text-text-secondary">
                실물 굿즈는 주문 후 영업일 기준 3-5일 이내 배송됩니다.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-neutral-200">
              <h3 className="text-lg font-bold text-text-primary mb-3">
                디지털 상품 안내
              </h3>
              <p className="text-text-secondary">
                보이스팩은 결제 완료 후 마이페이지에서 즉시 다운로드 가능합니다.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-neutral-200">
              <h3 className="text-lg font-bold text-text-primary mb-3">
                환불 정책
              </h3>
              <p className="text-text-secondary">
                디지털 상품은 다운로드 전까지만 환불 가능합니다. 실물 굿즈는 배송 전까지 취소 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
