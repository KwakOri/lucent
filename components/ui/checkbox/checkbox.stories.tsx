import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from ".";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "이용약관에 동의합니다",
  },
};

export const Checked: Story = {
  args: {
    label: "마케팅 수신 동의",
    defaultChecked: true,
  },
};

export const Error: Story = {
  args: {
    label: "필수 동의 항목",
    error: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "비활성 상태",
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: "비활성 + 체크됨",
    disabled: true,
    defaultChecked: true,
  },
};

export const Small: Story = {
  args: {
    label: "작은 체크박스",
    size: "sm",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Checkbox label="기본 체크박스" />
      <Checkbox label="체크된 상태" defaultChecked />
      <Checkbox label="에러 상태" error />
      <Checkbox label="비활성 상태" disabled />
      <Checkbox label="비활성 + 체크됨" disabled defaultChecked />
      <Checkbox label="작은 크기" size="sm" />
      <Checkbox label="중간 크기 (기본)" size="md" />
    </div>
  ),
};
