import { NextResponse, type NextRequest } from "next/server";
import { exchangeAuthCode } from "@/lib/auth/session";

// Magic-link landing (FR-004). Supabase mode only.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (code) {
    try {
      await exchangeAuthCode(code);
    } catch {
      return NextResponse.redirect(new URL("/login?error=1", req.url));
    }
  }
  return NextResponse.redirect(new URL("/", req.url));
}
