import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { env } from "@/lib/env";

// All Anthropic calls are server-side (PRD rule 7). The key never reaches the browser.
// Without ANTHROPIC_API_KEY every feature falls back to a non-AI path (US-E08).

let client: Anthropic | null | undefined;
export function llm(): Anthropic | null {
  if (client === undefined) client = env.anthropicKey ? new Anthropic({ apiKey: env.anthropicKey, maxRetries: 1 }) : null;
  return client;
}
export const llmAvailable = () => llm() !== null;

// Server-side refusal fallback for the main model: if a request is declined the
// API re-runs it on a fallback model inside the same call.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

type Content = Anthropic.Beta.BetaContentBlockParam[] | string;

/**
 * One structured-output call. Returns null on refusal, truncation, timeout or
 * a response that doesn't validate — callers then use their manual/non-AI path.
 */
export async function structured<S extends z.ZodType>(opts: {
  tier: "main" | "fast";
  system: string;
  content: Content;
  schema: S;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<z.infer<S> | null> {
  const c = llm();
  if (!c) return null;
  try {
    if (opts.tier === "main") {
      const res = await c.beta.messages.parse(
        {
          model: env.modelMain,
          max_tokens: opts.maxTokens ?? 4000,
          system: opts.system,
          messages: [{ role: "user", content: opts.content }],
          output_config: { effort: "low", format: betaZodOutputFormat(opts.schema) },
          ...FALLBACK,
        },
        { timeout: opts.timeoutMs ?? 20_000 },
      );
      if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") return null;
      const parsed = opts.schema.safeParse(res.parsed_output);
      return parsed.success ? parsed.data : null;
    }
    const res = await c.messages.parse(
      {
        model: env.modelFast,
        max_tokens: opts.maxTokens ?? 1500,
        system: opts.system,
        messages: [{ role: "user", content: opts.content as Anthropic.ContentBlockParam[] | string }],
        output_config: { effort: "low", format: zodOutputFormat(opts.schema) },
      },
      { timeout: opts.timeoutMs ?? 10_000 },
    );
    if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") return null;
    const parsed = opts.schema.safeParse(res.parsed_output);
    return parsed.success ? parsed.data : null;
  } catch (e) {
    // Never log prompts, images or message content (PRD §7.2) — only the error class.
    console.warn("llm.structured failed:", e instanceof Anthropic.APIError ? `${e.status} ${e.name}` : (e as Error).name);
    return null;
  }
}

/** Streamed answer for the Life Assistant. Yields text deltas. */
export async function* streamText(opts: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  maxTokens?: number;
}): AsyncGenerator<string> {
  const c = llm();
  if (!c) return;
  const stream = c.beta.messages.stream(
    {
      model: env.modelMain,
      max_tokens: opts.maxTokens ?? 2000,
      system: opts.system,
      messages: opts.messages,
      output_config: { effort: "low" },
      ...FALLBACK,
    },
    { timeout: 30_000 },
  );
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
  }
}

/** Wrap untrusted text (OCR, user input) so the model treats it as data (PRD §7.2, US-E09). */
export function untrusted(tag: string, text: string): string {
  const safe = text.replaceAll(`</${tag}>`, `<\\/${tag}>`);
  return `<${tag}>\n${safe}\n</${tag}>`;
}
