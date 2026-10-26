import { Stone } from "./stone";

/**
 * 10 ván gần nhất, cũ → mới. Thắng = quân đen khắc "T", thua = quân trắng khắc "B":
 * kết quả luôn đọc được bằng chữ, không chỉ bằng màu.
 */
export function FormStones({ form, size = 28 }: { form: { matchId: string; won: boolean }[]; size?: number }) {
  if (!form.length) return <p className="text-sm text-muted-foreground">Chưa có ván nào.</p>;
  const wins = form.filter((f) => f.won).length;
  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label={`${form.length} ván gần nhất: ${wins} thắng, ${form.length - wins} thua`}>
      {form.map((f, i) => (
        <li key={f.matchId} title={f.won ? "Thắng" : "Thua"}>
          <Stone color={f.won ? "black" : "white"} size={size} className="animate-stone-drop" style={{ animationDelay: `${i * 40}ms` }}>
            <span className="stone__glyph" aria-hidden>
              {f.won ? "T" : "B"}
            </span>
          </Stone>
        </li>
      ))}
    </ul>
  );
}
