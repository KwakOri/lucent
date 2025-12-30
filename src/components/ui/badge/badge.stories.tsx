import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from ".";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "일반",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "배송완료",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "한정수량",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    children: "품절",
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    children: "NEW",
  },
};

export const Medium: Story = {
  args: {
    variant: "success",
    size: "md",
    children: "결제완료",
  },
};

export const AllVariants: Story = {
  args: {
    children: "뱃지",
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-text-secondary">기본 크기 (sm)</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>일반</Badge>
          <Badge variant="success">배송완료</Badge>
          <Badge variant="warning">한정수량</Badge>
          <Badge variant="error">품절</Badge>
          <Badge variant="info">NEW</Badge>
        </div>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-sm font-medium text-text-secondary mb-4">중간 크기 (md)</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="md">일반</Badge>
          <Badge variant="success" size="md">배송완료</Badge>
          <Badge variant="warning" size="md">한정수량</Badge>
          <Badge variant="error" size="md">품절</Badge>
          <Badge variant="info" size="md">NEW</Badge>
        </div>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          실제 사용 예시
        </h3>
        <div className="flex flex-col gap-4 max-w-md">
          <div className="p-4 border border-neutral-200 rounded-lg flex items-center justify-between">
            <div>
              <h4 className="font-medium text-text-primary">미루루 보이스팩 vol.1</h4>
              <p className="text-sm text-text-secondary mt-1">9,900원</p>
            </div>
            <Badge variant="info">NEW</Badge>
          </div>

          <div className="p-4 border border-neutral-200 rounded-lg flex items-center justify-between">
            <div>
              <h4 className="font-medium text-text-primary">미루루 아크릴 스탠드</h4>
              <p className="text-sm text-text-secondary mt-1">15,000원</p>
            </div>
            <Badge variant="warning">한정수량</Badge>
          </div>

          <div className="p-4 border border-neutral-200 rounded-lg flex items-center justify-between">
            <div>
              <h4 className="font-medium text-text-primary">미루루 포스터 세트</h4>
              <p className="text-sm text-text-secondary mt-1">12,000원</p>
            </div>
            <Badge variant="error">품절</Badge>
          </div>

          <div className="p-4 border border-neutral-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-text-primary">주문 #1234</h4>
              <Badge variant="success" size="md">배송완료</Badge>
            </div>
            <p className="text-sm text-text-secondary">미루루 보이스팩 vol.1</p>
          </div>
        </div>
      </div>
    </div>
  ),
};
