export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;
export type Cell = typeof EMPTY | typeof BLACK | typeof WHITE;

/** Bàn cờ Vây: đặt quân, bắt quân hết khí. Không ép luật ko (đây là bộ tái hiện, không phải trọng tài). */
export class Board {
  readonly cells: Uint8Array;
  constructor(readonly size: number) {
    this.cells = new Uint8Array(size * size);
  }

  index(x: number, y: number) {
    return y * this.size + x;
  }

  private neighbours(idx: number): number[] {
    const { size } = this;
    const x = idx % size;
    const y = (idx - x) / size;
    const out: number[] = [];
    if (x > 0) out.push(idx - 1);
    if (x < size - 1) out.push(idx + 1);
    if (y > 0) out.push(idx - size);
    if (y < size - 1) out.push(idx + size);
    return out;
  }

  /** Nhóm quân cùng màu nối liền và số khí của nhóm. */
  private group(start: number): { stones: number[]; liberties: number } {
    const color = this.cells[start];
    const seen = new Set<number>([start]);
    const libs = new Set<number>();
    const queue = [start];
    for (let q = 0; q < queue.length; q++) {
      for (const nb of this.neighbours(queue[q])) {
        const v = this.cells[nb];
        if (v === EMPTY) libs.add(nb);
        else if (v === color && !seen.has(nb)) {
          seen.add(nb);
          queue.push(nb);
        }
      }
    }
    return { stones: queue, liberties: libs.size };
  }

  set(x: number, y: number, color: Cell) {
    this.cells[this.index(x, y)] = color;
  }

  /**
   * Đặt quân. Trả về các điểm bị bắt (quân đối phương; nếu tự sát thì chính nhóm vừa đặt, `suicide = true`).
   * Ném lỗi nếu đi vào điểm đã có quân.
   */
  play(color: Cell, x: number, y: number): { captured: number[]; suicide: boolean } {
    const idx = this.index(x, y);
    if (this.cells[idx] !== EMPTY) throw new Error("occupied");
    this.cells[idx] = color;
    const enemy = color === BLACK ? WHITE : BLACK;

    const captured: number[] = [];
    for (const nb of this.neighbours(idx)) {
      if (this.cells[nb] !== enemy) continue;
      const g = this.group(nb);
      if (g.liberties === 0) {
        for (const s of g.stones) {
          if (this.cells[s] === enemy) {
            this.cells[s] = EMPTY;
            captured.push(s);
          }
        }
      }
    }
    if (captured.length === 0) {
      const own = this.group(idx);
      if (own.liberties === 0) {
        for (const s of own.stones) this.cells[s] = EMPTY;
        return { captured: own.stones, suicide: true };
      }
    }
    return { captured, suicide: false };
  }
}
