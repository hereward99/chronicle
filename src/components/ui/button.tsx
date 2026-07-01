import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Marks this button as a mutation trigger that requires an internet connection.
   * When offline, the button is auto-disabled with an explanatory tooltip.
   * `type="submit"` buttons opt in automatically. Pass `offlineDisabled={false}`
   * to opt a submit button out (e.g. local-only forms like search).
   */
  offlineDisabled?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, offlineDisabled, type, disabled, title, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { isOnline } = useOnlineStatus();

    const shouldGuardOffline =
      offlineDisabled ?? (type === "submit" && variant !== "outline" && variant !== "ghost" && variant !== "link");

    const offlineBlocked = shouldGuardOffline && !isOnline;
    const finalDisabled = disabled || offlineBlocked;
    const finalTitle = offlineBlocked ? "You're offline — reconnect to continue" : title;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={type}
        disabled={finalDisabled}
        title={finalTitle}
        aria-disabled={finalDisabled || undefined}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
