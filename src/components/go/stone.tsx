import * as React from "react";
import { cn, hashString } from "@/lib/utils";
import type { StoneColor } from "@/lib/data/types";

type StoneProps = Omit<React.ComponentProps<"span">, "color"> & {
  color: StoneColor;
  /** Đường kính (px). */
  size?: number;
};

/** Một quân cờ thuần hình ảnh. */
export function Stone({ color, size = 44, className, style, children, ...props }: StoneProps) {
  return (
    <span
      className={cn("stone", color === "black" ? "stone--black" : "stone--white", className)}
      style={{ "--size": `${size}px`, ...style } as React.CSSProperties}
      {...props}
    >
      {children}
    </span>
  );
}

export const stoneColorFor = (name: string): StoneColor => (hashString(name) % 2 === 0 ? "black" : "white");

/** Chữ cái khắc trên quân: tên Việt đặt tên riêng ở cuối ("Lê Quang Huy" → H). */
export function initialOf(name: string): string {
  const last = name.trim().split(/\s+/).at(-1) ?? "?";
  return (last[0] ?? "?").toLocaleUpperCase("vi");
}

type AvatarPlayer = { display_name: string; avatar_tone?: StoneColor | null; avatar_glyph?: string | null };

type StoneAvatarProps = Omit<StoneProps, "color" | "children"> & {
  /** Kỳ thủ: lấy tên, màu quân và ký tự khắc người đó đã chọn. */
  player?: AvatarPlayer;
  /** Chỉ dùng khi không có `player` (ví dụ bảng xếp hạng chỉ có tên). */
  name?: string;
  /** Ép màu quân (ví dụ theo màu cầm trong một ván). Mặc định: người đó chọn, hoặc ổn định theo tên. */
  tone?: StoneColor;
  /** Đặt true khi avatar đứng một mình, không có tên bên cạnh. */
  labelled?: boolean;
};

const graphemes = (s: string) => [...new Intl.Segmenter("vi", { granularity: "grapheme" }).segment(s)];

/** Avatar kỳ thủ: quân Đen/Trắng khắc ký tự (mặc định chữ cái đầu của tên), hơi nghiêng như khắc tay. */
export function StoneAvatar({ player, name: nameProp, tone, labelled = false, size = 44, className, ...props }: StoneAvatarProps) {
  const name = player?.display_name ?? nameProp ?? "?";
  const h = hashString(name);
  const glyph = player?.avatar_glyph?.trim() || initialOf(name);
  const long = graphemes(glyph).length > 1;
  return (
    <Stone
      color={tone ?? player?.avatar_tone ?? stoneColorFor(name)}
      size={size}
      className={className}
      {...(labelled ? { role: "img", "aria-label": name } : { "aria-hidden": true })}
      {...props}
    >
      <span className="stone__glyph" style={{ rotate: `${(h % 9) - 4}deg`, fontSize: long ? "0.74em" : undefined }}>
        {glyph}
      </span>
    </Stone>
  );
}
