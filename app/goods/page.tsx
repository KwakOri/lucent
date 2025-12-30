'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GoodsHubPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Goods Shop
          </h1>
          <p className="text-lg text-text-secondary">
            아티스트별 굿즈를 만나보세요
          </p>
        </div>

        {/* Artist Shop Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Miruru Shop - Active */}
          <Link
            href="/goods/miruru"
            className="group block bg-white rounded-2xl border-2 border-[#A8D5E2] overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="aspect-video bg-gradient-to-br from-[#E3F2FD] to-[#A8D5E2] flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/50 flex items-center justify-center">
                  <span className="text-4xl">🌸</span>
                </div>
                <h2 className="text-3xl font-bold text-text-primary">
                  미루루
                </h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-text-secondary mb-4">
                포근하고 다정한 동물의 숲 컨셉의 미루루 굿즈샵
              </p>
              <Button intent="primary" fullWidth>
                샵 보러가기
              </Button>
            </div>
          </Link>

          {/* Drips Shop - Coming Soon */}
          <div className="block bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden opacity-60 cursor-not-allowed">
            <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/50 flex items-center justify-center">
                  <span className="text-4xl">💧</span>
                </div>
                <h2 className="text-3xl font-bold text-text-primary">
                  Drips
                </h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-text-secondary mb-4">
                준비 중입니다
              </p>
              <Button intent="secondary" fullWidth disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
