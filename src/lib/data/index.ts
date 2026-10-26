import { isSupabaseConfigured } from "@/lib/supabase/config";
import { demoRepository } from "./demo";
import { supabaseRepository } from "./supabase";
import type { Repository } from "./types";

export const isDemoMode = !isSupabaseConfigured;

/** Trang & API chỉ làm việc với `Repository`; biến môi trường quyết định hiện thực nào chạy. */
export const repo: Repository = isDemoMode ? demoRepository : supabaseRepository;

export * from "./types";
