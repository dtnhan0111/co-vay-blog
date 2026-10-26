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

type StoneAvatarProps = Omit<StoneProps, "color" | "children"> & {
  name: string;
  /** Ép màu quân (ví dụ theo màu cầm trong một ván). Mặc định: ổn định theo tên. */
  tone?: StoneColor;
  /** Đặt true khi avatar đứng một mình, không có tên bên cạnh. */
  labelled?: boolean;
};

/** Avatar kỳ thủ: quân Đen/Trắng khắc chữ cái đầu, hơi nghiêng như khắc tay. */
export function StoneAvatar({ name, tone, labelled = false, size = 44, className, ...props }: StoneAvatarProps) {
  const h = hashString(name);
  return (
    <Stone
      color={tone ?? stoneColorFor(name)}
      size={size}
      className={className}
      {...(labelled ? { role: "img", "aria-label": name } : { "aria-hidden": true })}
      {...props}
    >
      <span className="stone__glyph" style={{ rotate: `${(h % 9) - 4}deg` }}>
        {initialOf(name)}
      </span>
    </Stone>
  );
}
