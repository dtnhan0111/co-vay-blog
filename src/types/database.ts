/**
 * Kiểu cho schema Supabase — cùng định dạng với `supabase gen types typescript`.
 * Giữ đồng bộ với supabase/migrations/*.sql (hoặc chạy lại lệnh gen types khi schema đổi).
 *
 * Lưu ý: cột `users.email` không được cấp quyền SELECT cho client,
 * nên Row bên dưới mô tả bảng, còn ứng dụng chỉ đọc `UserPublicRow`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          address: string | null;
          meets_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          address?: string | null;
          meets_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clubs"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          auth_id: string | null;
          email: string | null;
          display_name: string;
          rank_value: number;
          club_id: string | null;
          bio: string | null;
          playing_since: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_id?: string | null;
          email?: string | null;
          display_name: string;
          rank_value?: number;
          club_id?: string | null;
          bio?: string | null;
          playing_since?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "users_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          black_player: string;
          white_player: string;
          winner: string;
          win_method: Database["public"]["Enums"]["win_method"];
          score_difference: number | null;
          played_on: string;
          location: string;
          club_id: string | null;
          note: string | null;
          board_size: number;
          handicap: number;
          status: Database["public"]["Enums"]["match_status"];
          recorded_by: string;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          black_player: string;
          white_player: string;
          winner: string;
          win_method: Database["public"]["Enums"]["win_method"];
          score_difference?: number | null;
          played_on?: string;
          location: string;
          club_id?: string | null;
          note?: string | null;
          board_size?: number;
          handicap?: number;
          status?: Database["public"]["Enums"]["match_status"];
          recorded_by: string;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "matches_black_player_fkey";
            columns: ["black_player"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_white_player_fkey";
            columns: ["white_player"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_winner_fkey";
            columns: ["winner"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      match_confirmations: {
        Row: {
          id: string;
          match_id: string;
          user_id: string;
          status: Database["public"]["Enums"]["match_status"];
          reason: string | null;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          user_id: string;
          status?: Database["public"]["Enums"]["match_status"];
          reason?: string | null;
          responded_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["match_confirmations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "match_confirmations_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: true;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_confirmations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      kudos: {
        Row: { match_id: string; user_id: string; created_at: string };
        Insert: { match_id: string; user_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["kudos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "kudos_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kudos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      current_user_id: { Args: Record<PropertyKey, never>; Returns: string | null };
    };
    Enums: {
      win_method: "points" | "resign" | "time";
      match_status: "pending" | "confirmed" | "rejected";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

/** Các cột của `users` mà client được phép đọc (không gồm email, auth_id). */
export type UserPublicRow = Omit<Tables<"users">, "email" | "auth_id">;
export const USER_PUBLIC_COLUMNS =
  "id, display_name, rank_value, club_id, bio, playing_since, created_at" as const;
