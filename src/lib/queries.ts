import { cache } from "react";
import { repo } from "@/lib/data";

/** Các truy vấn dùng chung giữa trang và API, cache theo request. */
export const getPlayers = cache(() => repo.listPlayers());
export const getClubs = cache(() => repo.listClubs());
export const getConfirmedMatches = cache(() => repo.listMatches({ status: "confirmed" }));

export const getPlayerMap = cache(async () => new Map((await getPlayers()).map((p) => [p.id, p])));
export const getClubMap = cache(async () => new Map((await getClubs()).map((c) => [c.id, c])));
