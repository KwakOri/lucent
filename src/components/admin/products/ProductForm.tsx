'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Artist {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  type: 'VOICE_PACK' | 'PHYSICAL_GOODS';
  artist_id: string;
  main_image_id: string;
  price: number;
  description?: string;
  stock?: number | null;
  sample_audio_url?: string;
  is_active: boolean;
}

interface ProductFormProps {
  artists: Artist[];
  product?: Product;
}

export function ProductForm({ artists, product }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    type: product?.type || 'VOICE_PACK' as 'VOICE_PACK' | 'PHYSICAL_GOODS',
    artist_id: product?.artist_id || artists[0]?.id || '',
    main_image_id: product?.main_image_id || '',
    price: product?.price || 0,
    description: product?.description || '',
    stock: product?.stock ?? null,
    sample_audio_url: product?.sample_audio_url || '',
    is_active: product?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = product
        ? `/api/products/${product.id}`
        : '/api/products';

      const method = product ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '저장에 실패했습니다');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장에 실패했습니다');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="space-y-6 bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6">
        {/* 상품 타입 */}
        <div>
          <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
            상품 타입 <span className="text-red-500">*</span>
            {product && <span className="ml-2 text-sm text-gray-500">(변경 불가)</span>}
          </label>
          <div className="space-y-2">
            <label className="inline-flex items-center mr-6">
              <input
                type="radio"
                value="VOICE_PACK"
                checked={formData.type === 'VOICE_PACK'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'VOICE_PACK' })}
                disabled={!!product}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">보이스팩</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="PHYSICAL_GOODS"
                checked={formData.type === 'PHYSICAL_GOODS'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PHYSICAL_GOODS' })}
                disabled={!!product}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">실물 굿즈</span>
            </label>
          </div>
        </div>

        {/* 아티스트 */}
        <div>
          <label htmlFor="artist_id" className="block text-sm font-medium leading-6 text-gray-900">
            소속 아티스트 <span className="text-red-500">*</span>
          </label>
          <select
            id="artist_id"
            required
            value={formData.artist_id}
            onChange={(e) => setFormData({ ...formData, artist_id: e.target.value })}
            className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
          </select>
        </div>

        {/* 상품명 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
            상품명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="미루루 보이스팩 Vol.1"
          />
        </div>

        {/* 슬러그 */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium leading-6 text-gray-900">
            슬러그 (URL) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="slug"
            required
            pattern="[a-z0-9-]+"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="voicepack-vol1"
          />
        </div>

        {/* 메인 이미지 ID (임시) */}
        <div>
          <label htmlFor="main_image_id" className="block text-sm font-medium leading-6 text-gray-900">
            메인 이미지 ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="main_image_id"
            required
            value={formData.main_image_id}
            onChange={(e) => setFormData({ ...formData, main_image_id: e.target.value })}
            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="이미지 UUID"
          />
          <p className="mt-1 text-sm text-gray-500">
            이미지 업로드 기능은 추후 구현됩니다
          </p>
        </div>

        {/* 가격 */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium leading-6 text-gray-900">
            가격 (원) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="price"
            required
            min="0"
            step="100"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="10000"
          />
        </div>

        {/* 재고 (실물 굿즈만) */}
        {formData.type === 'PHYSICAL_GOODS' && (
          <div>
            <label htmlFor="stock" className="block text-sm font-medium leading-6 text-gray-900">
              재고 (선택)
            </label>
            <input
              type="number"
              id="stock"
              min="0"
              value={formData.stock ?? ''}
              onChange={(e) => setFormData({
                ...formData,
                stock: e.target.value ? parseInt(e.target.value) : null
              })}
              className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
              placeholder="비워두면 무제한"
            />
          </div>
        )}

        {/* 샘플 오디오 URL (보이스팩만) */}
        {formData.type === 'VOICE_PACK' && (
          <div>
            <label htmlFor="sample_audio_url" className="block text-sm font-medium leading-6 text-gray-900">
              샘플 오디오 URL (선택)
            </label>
            <input
              type="url"
              id="sample_audio_url"
              value={formData.sample_audio_url}
              onChange={(e) => setFormData({ ...formData, sample_audio_url: e.target.value })}
              className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
              placeholder="https://..."
            />
          </div>
        )}

        {/* 설명 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
            설명 (선택)
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="상품 설명..."
          />
        </div>

        {/* 활성 상태 */}
        <div className="relative flex items-start">
          <div className="flex h-6 items-center">
            <input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
          </div>
          <div className="ml-3 text-sm leading-6">
            <label htmlFor="is_active" className="font-medium text-gray-900">
              활성화
            </label>
            <p className="text-gray-500">상품을 공개 페이지에 표시합니다</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-x-3 mt-6">
        <Link
          href="/admin/products"
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}
