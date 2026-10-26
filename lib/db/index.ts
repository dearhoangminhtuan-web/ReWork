// Database access. One SQL code path, two drivers:
//  - DATABASE_URL set   → node-postgres (Supabase Postgres or any Postgres)
//  - DATABASE_URL unset → PGlite, an in-process Postgres seeded from
//                         supabase/migrations + seed (demo mode, no setup)
// Every user-facing query runs inside withActor({ userId }) which switches to
// the `authenticated` role and sets the JWT claims, so Postgres RLS applies
// exactly as it does on Supabase. "service" is reserved for server-side jobs
// (aggregation, retention, LLM summaries) and never returns raw rows to users.
import type { PGlite } from "@electric-sql/pglite";
import type { Pool } from "pg";
import { MIGRATIONS, SEED_KB_SQL, SEED_SQL } from "./bootstrap.generated";

export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export type Actor = { userId: string } | "service";

interface Driver {
  kind: "pglite" | "pg";
  transaction<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
}

function pgliteDriver(db: PGlite): Driver {
  return {
    kind: "pglite",
    transaction: (fn) =>
      db.transaction(async (tx) =>
        fn({ query: async (sql, params) => ({ rows: (await tx.query(sql, params as unknown[])).rows as never[] }) }),
      ),
  };
}

function pgDriver(pool: Pool): Driver {
  return {
    kind: "pg",
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const out = await fn({ query: async (sql, params) => ({ rows: (await client.query(sql, params)).rows }) });
        await client.query("commit");
        return out;
      } catch (e) {
        await client.query("rollback").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

/** Fresh, fully seeded in-process database. Used by demo mode and tests. */
export async function createPgliteDriver(opts: { seed?: boolean } = {}): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  for (const m of MIGRATIONS) {
    try {
      await db.exec(m.sql);
    } catch (e) {
      throw new Error(`migration ${m.name} failed: ${(e as Error).message}`);
    }
  }
  if (opts.seed !== false) {
    await db.exec(SEED_SQL);
    await db.exec(SEED_KB_SQL);
  }
  return pgliteDriver(db);
}

/**
 * Node-postgres driver. With bootstrap=true, runs migrations + seed first
 * (used by tests against a throwaway database).
 */
export async function createPgDriver(connectionString: string, opts: { bootstrap?: boolean } = {}): Promise<Driver> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString, max: 5 });
  if (opts.bootstrap) {
    const c = await pool.connect();
    try {
      for (const m of MIGRATIONS) await c.query(m.sql);
      await c.query(SEED_SQL);
      await c.query(SEED_KB_SQL);
    } finally {
      c.release();
    }
  }
  return pgDriver(pool);
}

const g = globalThis as unknown as { __reworkDriver?: Promise<Driver> };

function getDriver(): Promise<Driver> {
  if (!g.__reworkDriver) {
    g.__reworkDriver = (async () => {
      if (process.env.DATABASE_URL) return createPgDriver(process.env.DATABASE_URL);
      return createPgliteDriver();
    })().catch((e) => {
      g.__reworkDriver = undefined;
      throw e;
    });
  }
  return g.__reworkDriver;
}

export async function runAs<T>(driver: Driver, actor: Actor, fn: (q: Queryable) => Promise<T>): Promise<T> {
  return driver.transaction(async (q) => {
    if (actor !== "service") {
      await q.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ sub: actor.userId, role: "authenticated" }),
      ]);
      await q.query("set local role authenticated");
    }
    return fn(q);
  });
}

/** Run queries as a signed-in user (RLS enforced) or as the service. */
export async function withActor<T>(actor: Actor, fn: (q: Queryable) => Promise<T>): Promise<T> {
  return runAs(await getDriver(), actor, fn);
}

export async function dbKind(): Promise<"pglite" | "pg"> {
  return (await getDriver()).kind;
}

/** Small helpers so call sites stay short. */
export async function one<T>(q: Queryable, sql: string, params?: unknown[]): Promise<T | null> {
  const { rows } = await q.query<T>(sql, params);
  return rows[0] ?? null;
}
export async function many<T>(q: Queryable, sql: string, params?: unknown[]): Promise<T[]> {
  return (await q.query<T>(sql, params)).rows;
}
