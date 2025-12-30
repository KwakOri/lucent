import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from ".";
import { Input } from "../input";
import { Select } from "../select";
import { Checkbox } from "../checkbox";

const meta = {
  title: "UI/FormField",
  component: FormField,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInput: Story = {
  args: {
    label: "이메일",
    htmlFor: "email",
    children: <Input id="email" type="email" placeholder="이메일을 입력하세요" />,
  },
};

export const Required: Story = {
  args: {
    label: "이메일",
    htmlFor: "email",
    required: true,
    children: <Input id="email" type="email" placeholder="이메일을 입력하세요" />,
  },
};

export const WithError: Story = {
  args: {
    label: "이메일",
    htmlFor: "email",
    required: true,
    error: "올바른 이메일 형식이 아닙니다",
    children: <Input id="email" type="email" error />,
  },
};

export const WithHelp: Story = {
  args: {
    label: "비밀번호",
    htmlFor: "password",
    help: "8자 이상 입력하세요",
    children: <Input id="password" type="password" />,
  },
};

export const WithSelect: Story = {
  args: {
    label: "배송 방법",
    htmlFor: "delivery",
    required: true,
    children: (
      <Select
        id="delivery"
        options={[
          { label: "택배 배송", value: "delivery" },
          { label: "직접 수령", value: "pickup" },
        ]}
        placeholder="선택하세요"
      />
    ),
  },
};

export const WithCheckbox: Story = {
  args: {
    label: "약관 동의",
    children: <Checkbox label="이용약관에 동의합니다" />,
  },
};

export const AllVariants: Story = {
  args: {
    label: "이름",
    children: null,
  },
  render: () => (
    <div className="flex flex-col gap-6 max-w-md">
      <FormField label="이름" htmlFor="name" required>
        <Input id="name" type="text" placeholder="이름을 입력하세요" />
      </FormField>

      <FormField
        label="이메일"
        htmlFor="email-error"
        required
        error="올바른 이메일 형식이 아닙니다"
      >
        <Input id="email-error" type="email" error />
      </FormField>

      <FormField
        label="비밀번호"
        htmlFor="password-help"
        help="8자 이상, 영문/숫자/특수문자 조합"
      >
        <Input id="password-help" type="password" />
      </FormField>

      <FormField label="배송 방법" htmlFor="delivery-select">
        <Select
          id="delivery-select"
          options={[
            { label: "택배 배송", value: "delivery" },
            { label: "직접 수령", value: "pickup" },
          ]}
          placeholder="선택하세요"
        />
      </FormField>
    </div>
  ),
};
