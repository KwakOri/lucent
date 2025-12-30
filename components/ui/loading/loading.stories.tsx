import type { Meta, StoryObj } from "@storybook/react";
import { Loading } from ".";

const meta = {
  title: "UI/Loading",
  component: Loading,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithText: Story = {
  args: {
    text: "불러오는 중입니다",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    text: "로딩 중",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    text: "데이터를 불러오고 있어요",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    text: "잠시만 기다려 주세요",
  },
};

export const FullScreen: Story = {
  args: {
    size: "lg",
    text: "페이지를 불러오고 있어요",
    fullScreen: true,
  },
  parameters: {
    layout: "fullscreen",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-text-secondary">크기 변형</h3>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Loading size="sm" />
            <span className="text-xs text-text-muted">Small</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Loading size="md" />
            <span className="text-xs text-text-muted">Medium</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Loading size="lg" />
            <span className="text-xs text-text-muted">Large</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-sm font-medium text-text-secondary mb-4">텍스트 포함</h3>
        <div className="flex flex-col gap-6">
          <Loading size="sm" text="로딩 중" />
          <Loading size="md" text="데이터를 불러오고 있어요" />
          <Loading size="lg" text="잠시만 기다려 주세요" />
        </div>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          인라인 사용 (버튼, 카드 등)
        </h3>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-primary-700 text-text-inverse rounded-lg flex items-center gap-2">
            <Loading size="sm" className="text-text-inverse" />
            <span>처리 중</span>
          </button>
          <div className="px-4 py-2 border border-neutral-200 rounded-lg flex items-center gap-2">
            <Loading size="sm" />
            <span className="text-sm text-text-secondary">불러오는 중</span>
          </div>
        </div>
      </div>
    </div>
  ),
};
