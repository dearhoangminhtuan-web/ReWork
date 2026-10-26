// FR-022 (MVP retrieval): tag + keyword match over a tiny KB. Deterministic and
// testable; swap for Postgres FTS / embeddings later (P2).
import type { Topic } from "@/lib/llm/schemas";

export interface KbArticle {
  slug: string;
  prefectureCode: string | null;
  topic: string;
  language: string;
  title: string;
  bodyMd: string;
  tags: string[];
  sourceUrl: string | null;
  isSample: boolean;
}

const norm = (s: string) => s.toLowerCase().normalize("NFKC");

export function scoreArticle(a: KbArticle, query: string, terms: string[], topic: Topic | null): number {
  const q = norm(query);
  const ts = terms.map(norm).filter((x) => x.length > 1);
  let score = 0;
  for (const tag of a.tags.map(norm)) {
    if (tag.length > 1 && q.includes(tag)) score += 3;
    if (ts.some((t) => t === tag || t.includes(tag) || tag.includes(t))) score += 2;
  }
  const title = norm(a.title);
  for (const t of ts) if (title.includes(t)) score += 1;
  if (topic && a.topic === topic) score += 1.5;
  return score;
}

export function retrieve(articles: KbArticle[], opts: { query: string; terms: string[]; topic: Topic | null; prefectureCode: string; limit?: number }): KbArticle[] {
  return articles
    .filter((a) => a.prefectureCode === null || a.prefectureCode === opts.prefectureCode)
    .map((a) => ({ a, s: scoreArticle(a, opts.query, opts.terms, opts.topic) }))
    .filter((x) => x.s >= 3) // below this we'd rather say "I don't know" (US-E04)
    .sort((x, y) => y.s - x.s || x.a.slug.localeCompare(y.a.slug))
    .slice(0, opts.limit ?? 3)
    .map((x) => x.a);
}
