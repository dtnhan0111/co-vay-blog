import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Select gốc của trình duyệt (tốt nhất cho mobile), khoác kiểu mặt gỗ lõm. */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        data-slot="select"
        className="wood-inset h-11 w-full appearance-none rounded-xl pr-9 pl-3.5 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
}

export { Select };
