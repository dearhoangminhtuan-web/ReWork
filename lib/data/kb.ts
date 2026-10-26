import "server-only";
import { many, one, type Queryable } from "@/lib/db";
import type { KbArticle } from "@/lib/assistant/retrieve";

type Row = { slug: string; prefecture_code: string | null; topic: string; language: string; title: string; body_md: string; tags: string[]; source_url: string | null; is_sample: boolean };
const map = (r: Row): KbArticle => ({
  slug: r.slug,
  prefectureCode: r.prefecture_code,
  topic: r.topic,
  language: r.language,
  title: r.title,
  bodyMd: r.body_md,
  tags: r.tags,
  sourceUrl: r.source_url,
  isSample: r.is_sample,
});

export async function kbForLanguage(q: Queryable, language: string): Promise<KbArticle[]> {
  return (await many<Row>(q, `select * from kb_articles where language = $1 order by slug`, [language])).map(map);
}

export async function kbArticle(q: Queryable, slug: string, language: string): Promise<KbArticle | null> {
  const r = await one<Row>(
    q,
    `select * from kb_articles where slug = $1 order by (language = $2) desc, (language = 'en') desc limit 1`,
    [slug, language],
  );
  return r ? map(r) : null;
}

export async function kbAll(q: Queryable): Promise<KbArticle[]> {
  return (await many<Row>(q, `select * from kb_articles order by slug, language`)).map(map);
}
