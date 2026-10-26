// Server-side environment flags. Never import from client components.
export const env = {
  demoMode: process.env.DEMO_MODE === "true",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  modelMain: process.env.LLM_MODEL_MAIN || "claude-sonnet-5-5",
  modelFast: process.env.LLM_MODEL_FAST || "claude-haiku-5-5",
  cronSecret: process.env.CRON_SECRET ?? "",
};

/**
 * Auth backend. Supabase Auth when a project is configured and we're not in
 * demo mode; otherwise a signed cookie (demo accounts + anonymous workers on
 * the local/PGlite database).
 */
export function authMode(): "supabase" | "local" {
  return env.supabaseUrl && env.supabaseAnonKey && !env.demoMode ? "supabase" : "local";
}

export function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production" && !env.demoMode) {
    throw new Error("SESSION_SECRET (≥16 chars) is required in production outside demo mode");
  }
  return "rework-local-demo-secret-not-for-production";
}
