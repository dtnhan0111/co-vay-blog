"use client";

import Link from "next/link";
import { LogOut, Pencil, Plus, UserRound } from "lucide-react";
import { StoneAvatar } from "@/components/go/stone";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRank } from "@/lib/rank";

type Props = { viewer: { id: string; display_name: string; rank_value: number; avatar_tone: "black" | "white" | null; avatar_glyph: string | null } | null; pendingCount: number };

export function UserMenu({ viewer, pendingCount }: Props) {
  if (!viewer) {
    return (
      <Button asChild size="sm">
        <Link href="/login">Đăng nhập</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Tài khoản ${viewer.display_name}`}>
          <StoneAvatar player={viewer} size={40} />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 grid size-[18px] place-items-center rounded-full bg-wood text-[10px] font-bold text-white ring-2 ring-background">
              {pendingCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p className="font-medium">{viewer.display_name}</p>
          <p className="text-xs text-muted-foreground">{formatRank(viewer.rank_value)}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/players/${viewer.id}`}>
            <UserRound /> Hồ sơ của tôi
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/players/${viewer.id}?edit=1`}>
            <Pencil /> Đổi tên, hạng, giới thiệu
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/record">
            <Plus /> Ghi ván mới
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action="/auth/signout" method="post">
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut /> Đăng xuất
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
