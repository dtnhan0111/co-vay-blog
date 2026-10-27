import Link from "next/link";
import { Stone } from "@/components/go/stone";

export type FormEntry = { matchId: string; won: boolean; label: string };

/**
 * Phong độ gần đây: mỗi ván là một quân (đen = thắng, trắng = chưa thắng) có chữ T/B,
 * bấm vào mở ván đó. Ván mới nhất nằm bên phải và có viền đỏ triện.
 */
export function RecentForm({ form }: { form: FormEntry[] }) {
  if (form.length === 0) return <p className="text-sm text-muted-foreground">Chưa có ván nào để xem phong độ.</p>;
  const wins = form.filter((f) => f.won).length;
  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-2" aria-label={`${form.length} ván gần nhất: ${wins} thắng, ${form.length - wins} chưa thắng`}>
        {form.map((f, i) => (
          <li key={f.matchId}>
            <Link
              href={`/matches/${f.matchId}`}
              title={f.label}
              aria-label={f.label}
              className="grid size-11 place-items-center rounded-full transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              <Stone color={f.won ? "black" : "white"} size={34} className={i === form.length - 1 ? "ring-2 ring-seal ring-offset-2 ring-offset-card" : ""}>
                <span className="stone__glyph" aria-hidden>
                  {f.won ? "T" : "B"}
                </span>
              </Stone>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Cũ đến mới, từ trái sang phải. T là thắng, B là chưa thắng. Bấm một quân để xem ván.</p>
    </div>
  );
}
