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

export {
  CardHeader as EntityCardHeader,
  CardFooter as EntityCardFooter,
  CardTitle as EntityCardTitle,
  CardDescription as EntityCardDescription,
  CardContent as EntityCardContent,
};
