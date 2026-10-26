import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        wood: "bg-secondary text-secondary-foreground",
        soft: "bg-foreground/8 text-foreground",
        outline: "border border-input text-foreground",
        win: "bg-win/15 text-win",
        loss: "bg-loss/15 text-loss",
      },
    },
    defaultVariants: { variant: "soft" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
