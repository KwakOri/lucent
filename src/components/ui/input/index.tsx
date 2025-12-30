import { cva, type VariantProps } from "class-variance-authority";
import {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from "react";
import { clsx } from "clsx";

const inputVariants = cva(
  [
    "w-full",
    "font-normal",
    "transition-colors",
    "text-text-primary",
    "placeholder:text-text-muted",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    "disabled:cursor-not-allowed disabled:bg-neutral-100",
    "disabled:text-text-muted",
  ],
  {
    variants: {
      state: {
        default: [
          "border-neutral-200",
          "focus:border-primary-500",
          "focus:ring-primary-500/20",
        ],
        error: [
          "border-error-500",
          "focus:border-error-500",
          "focus:ring-error-500/20",
        ],
        disabled: ["border-neutral-200", "bg-neutral-100"],
        readOnly: ["border-neutral-200", "bg-neutral-50", "focus:ring-0"],
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-md",
        md: "h-11 px-4 text-base rounded-lg",
        lg: "h-14 px-4 text-lg rounded-lg",
      },
    },
    defaultVariants: {
      state: "default",
      size: "md",
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /**
   * Error state - shows error styling
   */
  error?: boolean;
}

/**
 * Input component following CVA-based variant system
 *
 * State variants:
 * - default: Normal input state
 * - error: Error state with red border
 * - disabled: Disabled state
 * - readOnly: Read-only state
 *
 * Note: This component should be used with FormField for label and error messages
 *
 * @example
 * ```tsx
 * <Input type="email" placeholder="이메일을 입력하세요" />
 * <Input type="password" error />
 * <Input type="text" disabled />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      state,
      size,
      error,
      disabled,
      readOnly,
      type = "text",
      ...props
    },
    ref
  ) => {
    // Determine the actual state based on props
    const actualState = disabled
      ? "disabled"
      : readOnly
        ? "readOnly"
        : error
          ? "error"
          : state || "default";

    return (
      <input
        ref={ref}
        type={type}
        className={clsx(
          inputVariants({ state: actualState, size }),
          "border",
          className
        )}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={error}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

// Textarea Variants
const textareaVariants = cva(
  [
    "w-full",
    "font-normal",
    "transition-colors",
    "text-text-primary",
    "placeholder:text-text-muted",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    "disabled:cursor-not-allowed disabled:bg-neutral-100",
    "disabled:text-text-muted",
    "min-h-[100px]",
    "resize-y",
  ],
  {
    variants: {
      state: {
        default: [
          "border-neutral-200",
          "focus:border-primary-500",
          "focus:ring-primary-500/20",
        ],
        error: [
          "border-error-500",
          "focus:border-error-500",
          "focus:ring-error-500/20",
        ],
        disabled: ["border-neutral-200", "bg-neutral-100"],
        readOnly: ["border-neutral-200", "bg-neutral-50", "focus:ring-0"],
      },
      size: {
        sm: "p-3 text-sm rounded-md",
        md: "p-4 text-base rounded-lg",
        lg: "p-4 text-lg rounded-lg",
      },
      resize: {
        true: "resize-y",
        false: "resize-none",
      },
    },
    defaultVariants: {
      state: "default",
      size: "md",
      resize: true,
    },
  }
);

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof textareaVariants> {
  /**
   * Error state - shows error styling
   */
  error?: boolean;
}

/**
 * Textarea component following CVA-based variant system
 *
 * State variants:
 * - default: Normal textarea state
 * - error: Error state with red border
 * - disabled: Disabled state
 * - readOnly: Read-only state
 *
 * Note: This component should be used with FormField for label and error messages
 *
 * @example
 * ```tsx
 * <Textarea placeholder="내용을 입력하세요" />
 * <Textarea error rows={5} />
 * <Textarea resize={false} />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      state,
      size,
      resize,
      error,
      disabled,
      readOnly,
      rows = 4,
      ...props
    },
    ref
  ) => {
    // Determine the actual state based on props
    const actualState = disabled
      ? "disabled"
      : readOnly
        ? "readOnly"
        : error
          ? "error"
          : state || "default";

    return (
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          textareaVariants({ state: actualState, size, resize }),
          "border",
          className
        )}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={error}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
