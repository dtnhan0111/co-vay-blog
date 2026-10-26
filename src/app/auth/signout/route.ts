import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/data";
import { DEMO_COOKIE } from "@/lib/data/demo";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  if (isDemoMode) {
    response.cookies.delete(DEMO_COOKIE);
  } else {
    await (await createClient()).auth.signOut();
  }
  return response;
}
