import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from ".";
import { Button } from "../button";
import { ShoppingCart, Package, Search, Inbox } from "lucide-react";

const meta = {
  title: "UI/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "데이터가 없어요",
  },
};

export const WithIcon: Story = {
  args: {
    icon: Inbox,
    title: "데이터가 없어요",
  },
};

export const WithDescription: Story = {
  args: {
    icon: Package,
    title: "주문 내역이 없어요",
    description: "아직 주문한 상품이 없습니다",
  },
};

export const WithAction: Story = {
  args: {
    icon: ShoppingCart,
    title: "장바구니가 비어 있어요",
    description: "마음에 드는 상품을 담아보세요",
    action: <Button>상품 보러 가기</Button>,
  },
};

export const SearchNoResults: Story = {
  args: {
    icon: Search,
    title: "검색 결과가 없어요",
    description: "다른 검색어로 시도해 보세요",
  },
};

export const AllVariants: Story = {
  args: {
    title: "데이터가 없어요",
  },
  render: () => (
    <div className="flex flex-col gap-12">
      <div className="border rounded-lg p-6">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          기본 (텍스트만)
        </h3>
        <EmptyState title="데이터가 없어요" />
      </div>

      <div className="border rounded-lg p-6">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          아이콘 + 제목
        </h3>
        <EmptyState icon={Inbox} title="데이터가 없어요" />
      </div>

      <div className="border rounded-lg p-6">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          아이콘 + 제목 + 설명
        </h3>
        <EmptyState
          icon={Package}
          title="주문 내역이 없어요"
          description="아직 주문한 상품이 없습니다"
        />
      </div>

      <div className="border rounded-lg p-6">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          전체 구성 (아이콘 + 제목 + 설명 + 액션)
        </h3>
        <EmptyState
          icon={ShoppingCart}
          title="장바구니가 비어 있어요"
          description="마음에 드는 상품을 담아보세요"
          action={<Button>상품 보러 가기</Button>}
        />
      </div>

      <div className="border rounded-lg p-6">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          검색 결과 없음
        </h3>
        <EmptyState
          icon={Search}
          title="검색 결과가 없어요"
          description="다른 검색어로 시도해 보세요"
        />
      </div>
    </div>
  ),
};
