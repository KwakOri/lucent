import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes } from "react";
import { clsx } from "clsx";

const badgeVariants = cva(
  [
    "inline-flex items-center justify-center",
    "font-medium",
    "rounded-full",
    "whitespace-nowrap",
  ],
  {
    variants: {
      intent: {
        default: "bg-neutral-100 text-text-primary",
        success: "bg-success-100 text-success-600",
        warning: "bg-warning-100 text-warning-600",
        error: "bg-error-100 text-error-600",
        info: "bg-info-100 text-info-600",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: {
      intent: "default",
      size: "sm",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component - displays status, properties, or category labels
 *
 * Purpose:
 * - Quick visual recognition of status
 * - Improve scanning efficiency in lists/cards
 * - Provide visual emphasis with minimal cost
 *
 * Intent Variants:
 * - default: General information
 * - success: Positive state (completed, normal)
 * - warning: Caution state (limited, urgent)
 * - error: Negative state (sold out, failed)
 * - info: Neutral information
 *
 * Size Variants:
 * - sm: Small badge (default)
 * - md: Medium badge
 *
 * @example
 * ```tsx
 * <Badge>일반</Badge>
 * <Badge intent="success">배송완료</Badge>
 * <Badge intent="warning">한정수량</Badge>
 * <Badge intent="error">품절</Badge>
 * <Badge intent="info">NEW</Badge>
 * <Badge intent="success" size="md">결제완료</Badge>
 * ```
 */
export const Badge = ({
  className,
  intent,
  size,
  children,
  ...props
}: BadgeProps) => {
  return (
    <span
      className={clsx(badgeVariants({ intent, size }), className)}
      {...props}
    >
      {children}
    </span>
  );
};

Badge.displayName = "Badge";
