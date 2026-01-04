/**
 * BuyerInfoForm Component
 *
 * 주문자 정보 입력 폼 컴포넌트
 */

'use client';

import { NameInput, EmailInput, PhoneInput } from '@/components/form';

export interface BuyerInfo {
  name: string;
  email: string;
  phone: string;
}

interface BuyerInfoFormProps {
  value: BuyerInfo;
  onChange: (values: BuyerInfo) => void;
}

export function BuyerInfoForm({
  value,
  onChange,
}: BuyerInfoFormProps) {
  const handleChange = (field: keyof BuyerInfo, newValue: string) => {
    const newValues = { ...value, [field]: newValue };
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">주문자 정보</h2>
        <p className="text-sm text-gray-500">정보를 확인하고 수정할 수 있습니다</p>
      </div>

      <NameInput
        id="buyerName"
        name="buyerName"
        value={value.name}
        onChange={(newValue) => handleChange('name', newValue)}
        required
      />

      <EmailInput
        id="buyerEmail"
        name="buyerEmail"
        value={value.email}
        onChange={(newValue) => handleChange('email', newValue)}
        required
      />

      <PhoneInput
        id="buyerPhone"
        name="buyerPhone"
        value={value.phone}
        onChange={(newValue) => handleChange('phone', newValue)}
        required
      />
    </div>
  );
}
