import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

// Variants use tokens defined in src/index.css (@theme). `brand` follows the
// tenant color published by TenantContext (--primary-color / --primary-foreground).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-600 shadow-[var(--shadow-soft)]",
        brand: "bg-[var(--primary-color,var(--color-primary))] text-[color:var(--primary-foreground,white)] hover:brightness-95 shadow-[var(--shadow-soft)]",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        secondary: "bg-secondary-500 text-white hover:bg-secondary-600",
        ghost: "text-gray-700 hover:bg-gray-100",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-linear-to-r from-primary to-secondary-500 text-white hover:shadow-[var(--shadow-elevated)]",
        accent: "bg-accent-500 text-white hover:bg-accent-600",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-9 px-3",
        lg: "min-h-12 px-8 text-base",
        icon: "min-h-11 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

/* eslint-disable-next-line react-refresh/only-export-components -- buttonVariants se usa para estilos consistentes */
export { Button, buttonVariants };
