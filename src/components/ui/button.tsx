import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[transform,background-color,box-shadow,opacity] duration-200 outline-none select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_0_rgb(255_255_255/0.18)_inset,0_6px_14px_-6px_rgb(17_17_17/0.55)] hover:opacity-90",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_1px_0_rgb(255_255_255/0.2)_inset,0_6px_14px_-8px_rgb(42_33_24/0.6)] hover:opacity-90",
        outline: "border border-input bg-transparent text-foreground hover:bg-accent/60",
        ghost: "text-foreground hover:bg-accent/60",
        destructive: "bg-destructive text-white hover:opacity-90",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-12 px-7 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Hiện quân cờ xoay thay cho nội dung khi đang gửi. */
    pending?: boolean;
  };

function Button({ className, variant, size, asChild = false, pending = false, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {asChild ? children : (
        <>
          {pending && <span className="stone-spinner" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
