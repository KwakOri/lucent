'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { AddressSearchModal } from '@/components/order/AddressSearchModal';
import type { AddressSearchResult } from '@/types/address';

export default function WelcomePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mainAddress, setMainAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    detailAddress?: string;
    general?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // 전화번호 자동 하이픈 추가
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;

    if (cleaned.length <= 3) {
      formatted = cleaned;
    } else if (cleaned.length <= 7) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length <= 11) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }

    setPhone(formatted);
    setErrors({ ...errors, phone: undefined });
  };

  // 주소 선택 핸들러
  const handleAddressSelect = (address: AddressSearchResult) => {
    const selectedAddress = address.roadAddress || address.jibunAddress;
    const fullAddress = address.zonecode
      ? `[${address.zonecode}] ${selectedAddress}`
      : selectedAddress;

    setMainAddress(fullAddress);
    setIsAddressModalOpen(false);
  };

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // 이름 검증 (입력한 경우에만)
    if (name && name.length < 2) {
      newErrors.name = '이름은 2자 이상이어야 합니다';
    }

    // 전화번호 검증 (입력한 경우에만)
    if (phone && !/^01[0-9]-\d{3,4}-\d{4}$/.test(phone)) {
      newErrors.phone = '올바른 전화번호 형식을 입력해주세요 (예: 010-1234-5678)';
    }

    // 상세 주소 검증 (메인 주소를 입력한 경우에만 필수)
    if (mainAddress && !detailAddress.trim()) {
      newErrors.detailAddress = '상세 주소를 입력해주세요';
    } else if (detailAddress && detailAddress.length < 2) {
      newErrors.detailAddress = '상세 주소를 2자 이상 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 및 시작하기
  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      // 프로필 업데이트 API 호출
      const response = await fetch('/api/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || null,
          phone: phone || null,
          main_address: mainAddress || null,
          detail_address: detailAddress || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || '프로필 업데이트에 실패했습니다' });
        return;
      }

      // 성공 시 메인 페이지로 이동
      router.push('/');
    } catch (error) {
      setErrors({ general: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 건너뛰기
  const handleSkip = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-[500px]">
        <div className="bg-white rounded-lg border border-neutral-200 p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-text-primary">
              환영합니다!
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              프로필 정보를 입력하면 더 편리하게 이용할 수 있어요
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              (나중에 마이페이지에서도 입력 가능합니다)
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-5">
            {/* General Error */}
            {errors.general && (
              <div
                className="p-4 rounded-lg bg-error-100 text-error-600 text-sm"
                role="alert"
              >
                {errors.general}
              </div>
            )}

            {/* Name Field (Optional) */}
            <FormField
              label="이름"
              htmlFor="name"
              error={errors.name}
              help={!errors.name ? '선택 입력' : undefined}
            >
              <Input
                id="name"
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                disabled={isSaving}
              />
            </FormField>

            {/* Phone Field (Optional) */}
            <FormField
              label="전화번호"
              htmlFor="phone"
              error={errors.phone}
              help={!errors.phone ? '선택 입력 (예: 010-1234-5678)' : undefined}
            >
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                error={!!errors.phone}
                disabled={isSaving}
              />
            </FormField>

            {/* Address Field (Optional) */}
            <FormField
              label="주소"
              htmlFor="mainAddress"
              help="선택 입력 (주소 검색 버튼을 눌러 주소를 선택하세요)"
            >
              <div className="space-y-2">
                <Button
                  type="button"
                  intent="neutral"
                  size="md"
                  onClick={() => setIsAddressModalOpen(true)}
                  disabled={isSaving}
                  className="w-full"
                >
                  <Search size={18} />
                  <span className="ml-2">주소 검색</span>
                </Button>
                <Input
                  id="mainAddress"
                  type="text"
                  placeholder="주소 검색 버튼을 눌러 주소를 선택하세요"
                  value={mainAddress}
                  readOnly
                  disabled={isSaving}
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </FormField>

            {/* Detail Address Field (Required if main address is filled) */}
            {mainAddress && (
              <FormField
                label="상세 주소"
                htmlFor="detailAddress"
                required
                error={errors.detailAddress}
                help="동/호수 등 상세 주소를 입력하세요"
              >
                <Input
                  id="detailAddress"
                  type="text"
                  placeholder="예: 101동 202호"
                  value={detailAddress}
                  onChange={(e) => {
                    setDetailAddress(e.target.value);
                    setErrors({ ...errors, detailAddress: undefined });
                  }}
                  error={!!errors.detailAddress}
                  disabled={isSaving}
                  autoFocus
                />
              </FormField>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3 mt-8">
              {/* Save Button */}
              <Button
                type="submit"
                intent="primary"
                fullWidth
                loading={isSaving}
              >
                {isSaving ? '저장 중...' : '저장하고 시작하기'}
              </Button>

              {/* Skip Button */}
              <Button
                type="button"
                intent="secondary"
                fullWidth
                onClick={handleSkip}
                disabled={isSaving}
              >
                건너뛰기
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Address Search Modal */}
      <AddressSearchModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelect={handleAddressSelect}
      />
    </div>
  );
}
