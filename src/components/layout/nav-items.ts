import { ChartColumn, House, Swords, Users, type LucideIcon } from "lucide-react";

export const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Trang chủ", icon: House },
  { href: "/players", label: "Kỳ thủ", icon: Users },
  { href: "/head-to-head", label: "Đối đầu", icon: Swords },
  { href: "/stats", label: "Thống kê", icon: ChartColumn },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
