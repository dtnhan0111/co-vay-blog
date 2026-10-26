import { Stone } from "@/components/go/stone";

export type StoneColumn = { key: string; label: string; count: number; sub?: string; highlight?: boolean };

/**
 * Biểu đồ cột mà mỗi cột là một chồng quân cờ (đen/trắng xen kẽ) — một quân = một đơn vị.
 * Giá trị luôn được in thành chữ dưới/trên cột; có danh sách ẩn cho trình đọc màn hình.
 */
export function StoneColumns({ columns, unit, caption }: { columns: StoneColumn[]; unit: string; caption: string }) {
  const max = Math.max(1, ...columns.map((c) => c.count));
  const size = Math.max(11, Math.min(24, Math.floor(168 / max)));

  return (
    <figure>
      <div className="no-scrollbar overflow-x-auto">
        <div className="flex min-w-fit items-end justify-between gap-1 sm:gap-3" style={{ minHeight: size * max + 56 }} aria-hidden>
          {columns.map((c) => (
            <div key={c.key} className="flex min-w-6 flex-1 flex-col items-center justify-end gap-1.5" title={`${c.label}: ${c.count} ${unit}`}>
              <span className={`text-xs font-semibold tabular-nums ${c.count ? "" : "text-muted-foreground/60"}`}>{c.count}</span>
              <div className="flex flex-col-reverse items-center gap-px">
                {Array.from({ length: c.count }, (_, i) => (
                  <Stone key={i} color={i % 2 === 0 ? "black" : "white"} size={size} className={c.highlight ? "ring-2 ring-wood ring-offset-1 ring-offset-card" : undefined} />
                ))}
                {c.count === 0 && <span className="h-px w-5 bg-border" />}
              </div>
              <span className={`text-[11px] leading-tight ${c.highlight ? "font-semibold" : "text-muted-foreground"}`}>{c.label}</span>
              {c.sub && <span className="-mt-1 text-[10px] text-muted-foreground/80">{c.sub}</span>}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="sr-only">
        {caption}:{" "}
        {columns.map((c) => `${c.label} ${c.count} ${unit}`).join("; ")}
      </figcaption>
    </figure>
  );
}
