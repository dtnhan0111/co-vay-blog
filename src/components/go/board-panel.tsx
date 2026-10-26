import { cn } from "@/lib/utils";

/** Mặt bàn cờ gỗ có lưới kẻ nhẹ — dùng cho khối nổi bật (hero, form ghi ván). */
export function BoardPanel({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("wood-card wood-board relative overflow-hidden", className)} {...props}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgb(42 33 24 / .14) 1px, transparent 1px), linear-gradient(90deg, rgb(42 33 24 / .14) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          backgroundPosition: "14px 14px",
          maskImage: "linear-gradient(180deg, #000 0%, transparent 85%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
