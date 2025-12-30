import type { Meta, StoryObj } from "@storybook/react";
import { Button } from ".";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    intent: {
      control: "select",
      options: ["primary", "secondary", "danger", "neutral"],
      description: "Button intent variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Button size",
    },
    fullWidth: {
      control: "boolean",
      description: "Full width button",
    },
    loading: {
      control: "boolean",
      description: "Loading state",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    intent: "primary",
    children: "구매하기",
  },
};

export const Secondary: Story = {
  args: {
    intent: "secondary",
    children: "취소",
  },
};

export const Danger: Story = {
  args: {
    intent: "danger",
    children: "삭제",
  },
};

export const Neutral: Story = {
  args: {
    intent: "neutral",
    children: "자세히 보기",
  },
};

export const Loading: Story = {
  args: {
    intent: "primary",
    loading: true,
    children: "처리 중...",
  },
};

export const Disabled: Story = {
  args: {
    intent: "primary",
    disabled: true,
    children: "비활성",
  },
};

export const Small: Story = {
  args: {
    intent: "primary",
    size: "sm",
    children: "작은 버튼",
  },
};

export const Large: Story = {
  args: {
    intent: "primary",
    size: "lg",
    children: "큰 버튼",
  },
};

export const FullWidth: Story = {
  args: {
    intent: "primary",
    fullWidth: true,
    children: "전체 너비 버튼",
  },
  parameters: {
    layout: "padded",
  },
};

export const AllVariants: Story = {
  args: {
    children: "버튼",
  },
  render: () => (
    <div className="flex flex-col gap-4 min-w-[300px]">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-text-secondary">
          Intent Variants
        </h3>
        <Button intent="primary">Primary</Button>
        <Button intent="secondary">Secondary</Button>
        <Button intent="danger">Danger</Button>
        <Button intent="neutral">Neutral</Button>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-text-secondary">Sizes</h3>
        <Button intent="primary" size="sm">
          Small
        </Button>
        <Button intent="primary" size="md">
          Medium
        </Button>
        <Button intent="primary" size="lg">
          Large
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-text-secondary">States</h3>
        <Button intent="primary" loading>
          Loading
        </Button>
        <Button intent="primary" disabled>
          Disabled
        </Button>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
