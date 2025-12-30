import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from ".";

const meta = {
  title: "UI/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "알림 받기",
  },
};

export const Checked: Story = {
  args: {
    label: "자동 로그인",
    defaultChecked: true,
  },
};

export const Error: Story = {
  args: {
    label: "에러 상태",
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
    label: "비활성 + ON",
    disabled: true,
    defaultChecked: true,
  },
};

export const Small: Story = {
  args: {
    label: "작은 스위치",
    size: "sm",
  },
};

export const AllVariants: Story = {
  args: {
    label: "스위치",
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <Switch label="알림 받기" />
      <Switch label="자동 로그인" defaultChecked />
      <Switch label="마케팅 수신 동의" />
      <Switch label="에러 상태" error />
      <Switch label="비활성 상태" disabled />
      <Switch label="비활성 + ON" disabled defaultChecked />
      <div className="border-t pt-4 mt-2">
        <h3 className="text-sm font-medium text-text-secondary mb-3">크기 변형</h3>
        <div className="flex flex-col gap-3">
          <Switch label="작은 크기" size="sm" />
          <Switch label="중간 크기 (기본)" size="md" defaultChecked />
        </div>
      </div>
    </div>
  ),
};
