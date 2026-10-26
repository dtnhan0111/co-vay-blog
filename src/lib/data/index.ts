import { supabaseRepository } from "./supabase";
import type { Repository } from "./types";

/** Trang & API chỉ làm việc với `Repository` (hiện thực duy nhất: Supabase). */
export const repo: Repository = supabaseRepository;

export * from "./types";
