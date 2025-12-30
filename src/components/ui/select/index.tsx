import { cva, type VariantProps } from "class-variance-authority";
import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

const selectVariants = cva(
  [
    "w-full",
    "font-normal",
    "transition-colors",
    "appearance-none",
    "text-text-primary",
    "bg-neutral-0",
    "pr-10", // Space for icon
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

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectVariants> {
  /**
   * Select options
   */
  options: SelectOption[];
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Error state - shows error styling
   */
  error?: boolean;
}

/**
 * Select component following CVA-based variant system
 *
 * State variants:
 * - default: Normal select state
 * - error: Error state with red border
 * - disabled: Disabled state
 * - readOnly: Read-only state
 *
 * Note: This component should be used with FormField for label and error messages
 *
 * @example
 * ```tsx
 * <Select
 *   options={[
 *     { label: "택배 배송", value: "delivery" },
 *     { label: "직접 수령", value: "pickup" }
 *   ]}
 *   placeholder="배송 방법 선택"
 * />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      state,
      size,
      error,
      disabled,
      options,
      placeholder,
      ...props
    },
    ref
  ) => {
    // Determine the actual state based on props
    const actualState = disabled
      ? "disabled"
      : error
        ? "error"
        : state || "default";

    return (
      <div className="relative">
        <select
          ref={ref}
          className={clsx(
            selectVariants({ state: actualState, size }),
            "border",
            className
          )}
          disabled={disabled}
          aria-invalid={error}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown
            className={clsx(
              "w-5 h-5",
              disabled ? "text-text-muted" : "text-text-secondary"
            )}
          />
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";
