'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { NameInput, PhoneInput, AddressInput } from '@/components/form';

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
            {/* Address Input */}
            <AddressInput
              mainAddressId="mainAddress"
              mainAddressLabel="주소"
              mainAddressValue={mainAddress}
              onMainAddressChange={setMainAddress}
              detailAddressId="detailAddress"
              detailAddressValue={detailAddress}
              onDetailAddressChange={(value) => {
                setDetailAddress(value);
                setErrors({ ...errors, detailAddress: undefined });
              }}
              detailAddressError={errors.detailAddress}
              showDetailAlways={false}
              disabled={isSaving}
            />

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
    </div>
  );
}
