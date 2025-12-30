import { HTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Loading size
   */
  size?: "sm" | "md" | "lg";
  /**
   * Loading text
   */
  text?: string;
  /**
   * Full screen loading
   */
  fullScreen?: boolean;
}

/**
 * Loading component - shows loading state with spinner
 *
 * Types:
 * - Inline: Small spinner for buttons, inputs
 * - Section: Loading for specific section
 * - Full screen: Loading for entire page
 *
 * @example
 * ```tsx
 * <Loading />
 * <Loading text="불러오는 중입니다" />
 * <Loading size="lg" fullScreen />
 * ```
 */
export const Loading = ({
  size = "md",
  text,
  fullScreen = false,
  className,
  ...props
}: LoadingProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const content = (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      {...props}
    >
      <Loader2
        className={clsx(sizeClasses[size], "animate-spin text-primary-600")}
      />
      {text && (
        <p className="text-sm text-text-secondary">{text}</p>
      )}
      <span className="sr-only">로딩 중</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-0/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

Loading.displayName = "Loading";
