import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button, type ButtonProps } from "@/components/ui/button";

type EntityCardVariant = "list" | "panel";

export interface EntityCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** "list" for grid/list items (default), "panel" for dashboard sections. */
  variant?: EntityCardVariant;
  /** Adds a primary-coloured ring (e.g. the primary coterie). */
  highlighted?: boolean;
  /** Adds hover affordance + transition. Defaults to true for "list", false for "panel". */
  interactive?: boolean;
  /** Sets data-entity-id for the global search highlight system. */
  entityId?: string;
}

/**
 * EntityCard — single source of truth for card surfaces across the app.
 * Use `list` for items in a grid/list, `panel` for dashboard sections.
 */
export const EntityCard = React.forwardRef<HTMLDivElement, EntityCardProps>(
  (
    {
      className,
      variant = "list",
      highlighted = false,
      interactive,
      entityId,
      ...props
    },
    ref,
  ) => {
    const isInteractive = interactive ?? variant === "list";

    const surface =
      variant === "panel"
        ? "bg-gradient-subtle border-border shadow-gothic"
        : "bg-card border-border shadow-gothic";

    const hover = isInteractive
      ? "hover:shadow-crimson transition-shadow"
      : "";

    const ring = highlighted ? "ring-2 ring-primary" : "";

    return (
      <Card
        ref={ref}
        data-entity-id={entityId}
        className={cn(surface, hover, ring, className)}
        {...props}
      />
    );
  },
);
EntityCard.displayName = "EntityCard";

/* -------------------------------------------------------------------------- */
/*  EntityCardHeaderBar — shared header for every list-style entity card.     */
/* -------------------------------------------------------------------------- */

export interface EntityCardHeaderBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Leading icon or avatar element. */
  leading?: React.ReactNode;
  /** Title node (string or highlighted text). */
  title: React.ReactNode;
  /** Optional subtitle row (clan, date, location, etc.). */
  subtitle?: React.ReactNode;
  /** Status badge / metadata badge slot, top-right of the text block. */
  badge?: React.ReactNode;
  /** Icon-only action buttons; rendered in a flex row, top-right. */
  actions?: React.ReactNode;
  /** Extra class names for the title element. */
  titleClassName?: string;
  /** Pass-through to the underlying CardHeader. */
  headerClassName?: string;
}

/**
 * Standard header layout for entity cards:
 *
 *   [leading] [title …………………… badge] [actions]
 *             [subtitle ……………]
 *
 * Either or both of `badge` and `actions` are optional.
 */
export function EntityCardHeaderBar({
  leading,
  title,
  subtitle,
  badge,
  actions,
  titleClassName,
  headerClassName,
  className,
  ...rest
}: EntityCardHeaderBarProps) {
  return (
    <CardHeader className={cn("pb-3", headerClassName)}>
      <div
        className={cn("flex items-start justify-between gap-3", className)}
        {...rest}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {leading && <div className="shrink-0 mt-0.5">{leading}</div>}
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle
              className={cn(
                "text-lg text-foreground leading-tight break-words",
                titleClassName,
              )}
            >
              {title}
            </CardTitle>
            {subtitle && (
              <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap min-w-0">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {(actions || badge) && (
          <div className="flex flex-col items-end gap-2 shrink-0 self-start">
            {actions && (
              <div className="flex items-center gap-1">{actions}</div>
            )}
            {badge && <div>{badge}</div>}
          </div>
        )}
      </div>
    </CardHeader>
  );
}

/* -------------------------------------------------------------------------- */
/*  CardIconAction — standard icon-only header button.                        */
/* -------------------------------------------------------------------------- */

export interface CardIconActionProps extends Omit<ButtonProps, "size"> {
  /** Tooltip / accessible label. Required for discoverability. */
  label: string;
}

/**
 * Standard icon-only action button used in entity card header toolbars.
 * Wraps shadcn Button with a fixed 8x8 size and `ghost` default variant.
 */
export const CardIconAction = React.forwardRef<
  HTMLButtonElement,
  CardIconActionProps
>(({ label, variant = "ghost", className, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      title={label}
      aria-label={label}
      className={cn("h-8 w-8", className)}
      {...props}
    >
      {children}
    </Button>
  );
});
CardIconAction.displayName = "CardIconAction";

export {
  CardHeader as EntityCardHeader,
  CardFooter as EntityCardFooter,
  CardTitle as EntityCardTitle,
  CardDescription as EntityCardDescription,
  CardContent as EntityCardContent,
};
