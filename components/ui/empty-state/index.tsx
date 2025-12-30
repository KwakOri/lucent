import { ReactNode, HTMLAttributes } from "react";
import { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Icon component from lucide-react
   */
  icon?: LucideIcon;
  /**
   * Title message (required)
   */
  title: string;
  /**
   * Description text (optional)
   */
  description?: string;
  /**
   * Action button or element (optional)
   */
  action?: ReactNode;
}

/**
 * EmptyState component - shows when no data is available
 *
 * Purpose:
 * - Reduce user confusion
 * - Provide clear explanation of current state
 * - Guide next action naturally
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={ShoppingCart}
 *   title="장바구니가 비어 있어요"
 *   description="마음에 드는 상품을 담아보세요"
 *   action={<Button>상품 보러 가기</Button>}
 * />
 * ```
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-4 py-12 px-4 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100">
          <Icon className="w-8 h-8 text-text-muted" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

EmptyState.displayName = "EmptyState";
