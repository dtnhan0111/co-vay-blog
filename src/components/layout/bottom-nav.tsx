"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Stone } from "@/components/go/stone";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav-items";

/** Thanh điều hướng đáy (mobile). Nút giữa là một quân cờ lớn — "đặt quân" = ghi ván. */
export function BottomNav() {
  const pathname = usePathname();
  const [home, players, ...rest] = NAV_ITEMS;
  const items = [home, players, null, ...rest];

  return (
    <nav
      aria-label="Điều hướng chính"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-1.5">
        {items.map((item) =>
          item ? (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors",
                  isActive(pathname, item.href) ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("size-[22px]", isActive(pathname, item.href) && "stroke-[2.4]")} />
                {item.label}
              </Link>
            </li>
          ) : (
            <li key="record" className="flex justify-center">
              <Link href="/record" aria-label="Ghi ván mới" className="-mt-6 transition-transform active:scale-95">
                <Stone color="black" size={58} className="ring-4 ring-background">
                  <Plus className="size-6 text-paper" strokeWidth={2.2} />
                </Stone>
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
