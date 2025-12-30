import type { Meta, StoryObj } from "@storybook/react";
import { Input, Textarea } from ".";

const inputMeta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    state: {
      control: "select",
      options: ["default", "error", "disabled", "readOnly"],
      description: "Input state variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Input size",
    },
    error: {
      control: "boolean",
      description: "Error state",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state",
    },
    readOnly: {
      control: "boolean",
      description: "ReadOnly state",
    },
  },
} satisfies Meta<typeof Input>;

export default inputMeta;
type InputStory = StoryObj<typeof inputMeta>;

export const Default: InputStory = {
  args: {
    placeholder: "이메일을 입력하세요",
    type: "email",
  },
};

export const WithValue: InputStory = {
  args: {
    value: "example@email.com",
    type: "email",
  },
};

export const Error: InputStory = {
  args: {
    placeholder: "이메일을 입력하세요",
    error: true,
    type: "email",
  },
};

export const Disabled: InputStory = {
  args: {
    placeholder: "입력할 수 없습니다",
    disabled: true,
  },
};

export const ReadOnly: InputStory = {
  args: {
    value: "읽기 전용 값",
    readOnly: true,
  },
};

export const Password: InputStory = {
  args: {
    type: "password",
    placeholder: "비밀번호를 입력하세요",
  },
};

export const AllInputVariants: InputStory = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          기본 입력
        </label>
        <Input type="text" placeholder="텍스트를 입력하세요" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          에러 상태
        </label>
        <Input type="email" placeholder="이메일" error />
        <span className="text-sm text-error-600">
          올바른 이메일 형식이 아닙니다
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          비활성 상태
        </label>
        <Input type="text" placeholder="입력 불가" disabled />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          읽기 전용
        </label>
        <Input type="text" value="읽기 전용 값" readOnly />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          크기 변형
        </label>
        <Input type="text" placeholder="Small" size="sm" />
        <Input type="text" placeholder="Medium (기본)" size="md" />
        <Input type="text" placeholder="Large" size="lg" />
      </div>
    </div>
  ),
};

// Textarea Stories
const textareaMeta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    state: {
      control: "select",
      options: ["default", "error", "disabled", "readOnly"],
      description: "Textarea state variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Textarea size",
    },
    resize: {
      control: "boolean",
      description: "Allow resize",
    },
    error: {
      control: "boolean",
      description: "Error state",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state",
    },
    readOnly: {
      control: "boolean",
      description: "ReadOnly state",
    },
  },
} satisfies Meta<typeof Textarea>;

export const TextareaDefault: StoryObj<typeof textareaMeta> = {
  args: {
    placeholder: "내용을 입력하세요",
  },
};

export const TextareaWithValue: StoryObj<typeof textareaMeta> = {
  args: {
    value: "입력된 내용입니다.\n여러 줄의 텍스트를 입력할 수 있습니다.",
  },
};

export const TextareaError: StoryObj<typeof textareaMeta> = {
  args: {
    placeholder: "내용을 입력하세요",
    error: true,
  },
};

export const TextareaDisabled: StoryObj<typeof textareaMeta> = {
  args: {
    placeholder: "입력할 수 없습니다",
    disabled: true,
  },
};

export const TextareaNoResize: StoryObj<typeof textareaMeta> = {
  args: {
    placeholder: "크기 조절 불가",
    resize: false,
  },
};

export const AllTextareaVariants: StoryObj<typeof textareaMeta> = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          기본 Textarea
        </label>
        <Textarea placeholder="내용을 입력하세요" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          에러 상태
        </label>
        <Textarea placeholder="내용을 입력하세요" error />
        <span className="text-sm text-error-600">
          내용은 필수 입력 항목입니다
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          크기 조절 불가
        </label>
        <Textarea placeholder="크기 조절 불가" resize={false} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          비활성 상태
        </label>
        <Textarea placeholder="입력 불가" disabled />
      </div>
    </div>
  ),
};
