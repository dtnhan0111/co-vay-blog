import { cn } from "@/lib/utils";

/** Dấu triện đỏ nhỏ: đóng cạnh người thắng, như người chấm cờ đóng dấu lên kỳ phổ. */
export function Seal({ children = "勝", label = "Thắng", className }: { children?: string; label?: string; className?: string }) {
  return (
    <span
      title={label}
      className={cn(
        "inline-grid size-[22px] shrink-0 -rotate-3 place-items-center rounded-[3px] bg-seal font-display text-[13px] leading-none font-bold text-[#fff4e0] shadow-[inset_0_0_0_1px_rgb(255_244_224/0.28)]",
        className,
      )}
    >
      <span aria-hidden>{children}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
