import type { Meta, StoryObj } from "@storybook/react";
import { Radio } from ".";

const meta = {
  title: "UI/Radio",
  component: Radio,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "delivery",
    value: "normal",
    label: "일반 배송",
  },
};

export const Checked: Story = {
  args: {
    name: "delivery",
    value: "express",
    label: "빠른 배송",
    defaultChecked: true,
  },
};

export const Error: Story = {
  args: {
    name: "delivery",
    value: "quick",
    label: "퀵 배송",
    error: true,
  },
};

export const Disabled: Story = {
  args: {
    name: "delivery",
    value: "disabled",
    label: "비활성 상태",
    disabled: true,
  },
};

export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-text-primary">배송 방법 선택</h3>
      <div className="flex flex-col gap-2">
        <Radio name="delivery-group" value="normal" label="일반 배송" defaultChecked />
        <Radio name="delivery-group" value="express" label="빠른 배송" />
        <Radio name="delivery-group" value="quick" label="퀵 배송" />
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-text-secondary">기본 그룹</h3>
        <Radio name="group1" value="1" label="선택 1" defaultChecked />
        <Radio name="group1" value="2" label="선택 2" />
        <Radio name="group1" value="3" label="선택 3" />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-text-secondary">크기 변형</h3>
        <Radio name="group2" value="sm" label="작은 크기" size="sm" />
        <Radio name="group2" value="md" label="중간 크기 (기본)" size="md" defaultChecked />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-text-secondary">상태</h3>
        <Radio name="group3" value="error" label="에러 상태" error />
        <Radio name="group3" value="disabled" label="비활성 상태" disabled />
        <Radio name="group3" value="disabled-checked" label="비활성 + 체크됨" disabled defaultChecked />
      </div>
    </div>
  ),
};
