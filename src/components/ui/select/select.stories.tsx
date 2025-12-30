import type { Meta, StoryObj } from "@storybook/react";
import { Select } from ".";

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const deliveryOptions = [
  { label: "택배 배송", value: "delivery" },
  { label: "직접 수령", value: "pickup" },
  { label: "퀵 배송", value: "quick" },
];

export const Default: Story = {
  args: {
    options: deliveryOptions,
    placeholder: "배송 방법을 선택하세요",
  },
};

export const WithValue: Story = {
  args: {
    options: deliveryOptions,
    defaultValue: "delivery",
  },
};

export const Error: Story = {
  args: {
    options: deliveryOptions,
    placeholder: "선택하세요",
    error: true,
  },
};

export const Disabled: Story = {
  args: {
    options: deliveryOptions,
    placeholder: "선택 불가",
    disabled: true,
  },
};

export const AllVariants: Story = {
  args: {
    options: deliveryOptions,
  },
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          기본 Select
        </label>
        <Select options={deliveryOptions} placeholder="선택하세요" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          에러 상태
        </label>
        <Select options={deliveryOptions} placeholder="선택하세요" error />
        <span className="text-sm text-error-600">
          배송 방법을 선택해주세요
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          비활성 상태
        </label>
        <Select options={deliveryOptions} placeholder="선택 불가" disabled />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          크기 변형
        </label>
        <Select
          options={deliveryOptions}
          placeholder="Small"
          size="sm"
          defaultValue="delivery"
        />
        <Select
          options={deliveryOptions}
          placeholder="Medium (기본)"
          size="md"
          defaultValue="delivery"
        />
        <Select
          options={deliveryOptions}
          placeholder="Large"
          size="lg"
          defaultValue="delivery"
        />
      </div>
    </div>
  ),
};
