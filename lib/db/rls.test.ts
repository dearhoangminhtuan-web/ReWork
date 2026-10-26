// M1 acceptance: RLS proves employers cannot read chat / offers / swap /
// pulse_answers, and k = 5 is enforced for pulse results (M5: 4 vs 5).
import { beforeAll, describe, expect, it } from "vitest";
import { createPgDriver, createPgliteDriver, runAs, type Queryable } from "./index";

type Driver = Awaited<ReturnType<typeof createPgliteDriver>>;

const LINH = "40000000-0000-4000-a000-000000000001";
const OTHER_WORKER = "40000000-0000-4000-a000-000000000002";
const MINH = "40000000-0000-4000-a000-000000000010";
const SATO = "50000000-0000-4000-a000-000000000001"; // employer
const TANAKA = "50000000-0000-4000-a000-000000000002"; // support org
const MUNI = "50000000-0000-4000-a000-000000000003";
const FRONT_OCT = "60000000-0000-4000-a000-000000000001";
const KITCHEN_OCT = "60000000-0000-4000-a000-000000000002";
const ORG = "00000000-0000-4000-a000-000000000001";

let db: Driver;
const as = <T>(userId: string, fn: (q: Queryable) => Promise<T>) => runAs(db, { userId }, fn);
const count = async (q: Queryable, table: string) =>
  Number((await q.query<{ n: string }>(`select count(*)::int as n from ${table}`)).rows[0].n);

// Default: in-process PGlite. Set TEST_DATABASE_URL (a server you can create
// databases on) to run the same suite against a real Postgres.
async function freshDb(): Promise<Driver> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return createPgliteDriver();
  const { Client } = await import("pg");
  const name = `rework_test_${Date.now()}`;
  const admin = new Client({ connectionString: url });
  await admin.connect();
  await admin.query(`create database ${name}`);
  await admin.end();
  const u = new URL(url);
  u.pathname = `/${name}`;
  return createPgDriver(u.toString(), { bootstrap: true });
}

beforeAll(async () => {
  db = await freshDb();
  // give Linh an offer + comparison so there is something to hide
  await runAs(db, { userId: LINH }, async (q) => {
    const a = await q.query<{ id: string }>(
      `insert into offers (user_id, label, edited_json) values ($1,'A','{}') returning id`,
      [LINH],
    );
    const b = await q.query<{ id: string }>(
      `insert into offers (user_id, label, edited_json) values ($1,'B','{}') returning id`,
      [LINH],
    );
    await q.query(
      `insert into comparisons (user_id, offer_a_id, offer_b_id, result_json, assumptions_json) values ($1,$2,$3,'{}','{}')`,
      [LINH, a.rows[0].id, b.rows[0].id],
    );
  });
});

describe("employer cannot read worker-private data", () => {
  it("chat_messages: 0 rows", async () => {
    expect(await as(SATO, (q) => count(q, "chat_messages"))).toBe(0);
  });
  it("offers and comparisons: 0 rows", async () => {
    expect(await as(SATO, (q) => count(q, "offers"))).toBe(0);
    expect(await as(SATO, (q) => count(q, "comparisons"))).toBe(0);
  });
  it("swap_requests: 0 rows", async () => {
    expect(await as(SATO, (q) => count(q, "swap_requests"))).toBe(0);
  });
  it("pulse_answers: permission denied outright", async () => {
    await expect(as(SATO, (q) => count(q, "pulse_answers"))).rejects.toThrow(/permission denied/);
  });
  it("cannot see who answered (pulse_participation) or worker profiles/consents", async () => {
    expect(await as(SATO, (q) => count(q, "pulse_participation"))).toBe(0);
    expect(await as(SATO, (q) => count(q, "consents"))).toBe(0);
    const profiles = await as(SATO, (q) => q.query<{ user_id: string }>("select user_id from profiles"));
    expect(profiles.rows.map((r) => r.user_id)).toEqual([SATO]);
  });
});

describe("workers only see their own rows", () => {
  it("another worker cannot read Linh's chat or offers", async () => {
    expect(await as(OTHER_WORKER, (q) => count(q, "chat_messages"))).toBe(0);
    expect(await as(OTHER_WORKER, (q) => count(q, "offers"))).toBe(0);
  });
  it("Linh reads her own chat", async () => {
    expect(await as(LINH, (q) => count(q, "chat_messages"))).toBeGreaterThan(0);
  });
  it("a worker cannot self-assign a privileged role", async () => {
    await expect(as(LINH, (q) => q.query("update profiles set role = 'admin' where user_id = $1", [LINH]))).rejects.toThrow();
  });
  it("cannot read pulse answers either", async () => {
    await expect(as(LINH, (q) => count(q, "pulse_answers"))).rejects.toThrow(/permission denied/);
  });
});

describe("swap requests go only to the worker's own support org", () => {
  it("support org sees its inbox", async () => {
    expect(await as(TANAKA, (q) => count(q, "swap_requests"))).toBe(1);
  });
  it("worker without consent (FR-002c) cannot send", async () => {
    await expect(
      as(LINH, (q) =>
        q.query(`insert into swap_requests (worker_id, support_org_id, answers_json) values ($1,$2,'{}')`, [LINH, ORG]),
      ),
    ).rejects.toThrow(/row-level security/);
  });
  it("worker with consent can send, and only to their own org", async () => {
    await as(LINH, (q) => q.query("update consents set share_swap_with_org = true where user_id = $1", [LINH]));
    await as(LINH, (q) =>
      q.query(`insert into swap_requests (worker_id, support_org_id, answers_json) values ($1,$2,'{}')`, [LINH, ORG]),
    );
    expect(await as(TANAKA, (q) => count(q, "swap_requests"))).toBe(2);
    expect(await as(SATO, (q) => count(q, "swap_requests"))).toBe(0);
  });
  it("support org can change status but not the worker's answers", async () => {
    await as(TANAKA, (q) => q.query("update swap_requests set status = 'contacted'"));
    await expect(as(TANAKA, (q) => q.query(`update swap_requests set answers_json = '{}'`))).rejects.toThrow(
      /permission denied/,
    );
  });
  it("Minh only sees his own request", async () => {
    expect(await as(MINH, (q) => count(q, "swap_requests"))).toBe(1);
  });
});

describe("pulse k-anonymity (k = 5)", () => {
  type Res = { shown: boolean; response_count: number | null; avg_q1: string | null };
  const results = (survey: string) =>
    as(SATO, async (q) => (await q.query<Res>("select * from app.pulse_results($1)", [survey])).rows[0]);

  it("3 responses → hidden, count not revealed", async () => {
    const r = await results(KITCHEN_OCT);
    expect(r.shown).toBe(false);
    expect(r.response_count).toBeNull();
    expect(r.avg_q1).toBeNull();
  });

  it("4 responses → still hidden; 5 → shown", async () => {
    // a 4th kitchen answer via the service (simulates another worker)
    await runAs(db, "service", (q) =>
      q.query(`insert into pulse_answers (survey_id,q1,q2,q3,q4,q5) values ($1,3,3,3,3,3)`, [KITCHEN_OCT]),
    );
    expect((await results(KITCHEN_OCT)).shown).toBe(false);
    await runAs(db, "service", (q) =>
      q.query(`insert into pulse_answers (survey_id,q1,q2,q3,q4,q5) values ($1,4,4,4,4,4)`, [KITCHEN_OCT]),
    );
    const r = await results(KITCHEN_OCT);
    expect(r.shown).toBe(true);
    expect(Number(r.response_count)).toBe(5);
  });

  it("a worker cannot read results; another employer would be refused", async () => {
    await expect(as(LINH, (q) => q.query("select * from app.pulse_results($1)", [FRONT_OCT]))).rejects.toThrow(/forbidden/);
  });

  it("submit_pulse needs consent, then works once only", async () => {
    await expect(
      as(LINH, (q) => q.query("select app.submit_pulse($1,4,4,4,4,4,null)", [FRONT_OCT])),
    ).rejects.toThrow(/consent_required/);
    await as(LINH, (q) => q.query("update consents set survey_aggregate = true where user_id = $1", [LINH]));
    await as(LINH, (q) => q.query("select app.submit_pulse($1,4,4,4,4,4,'ok')", [FRONT_OCT]));
    await expect(
      as(LINH, (q) => q.query("select app.submit_pulse($1,4,4,4,4,4,null)", [FRONT_OCT])),
    ).rejects.toThrow(/duplicate key/);
  });
});

describe("municipality topic counts", () => {
  it("only categories with ≥ 5 users are visible", async () => {
    const rows = await as(MUNI, (q) =>
      q.query<{ distinct_users: number }>("select distinct_users from topic_counts"),
    );
    expect(rows.rows.length).toBeGreaterThan(0);
    expect(rows.rows.every((r) => Number(r.distinct_users) >= 5)).toBe(true);
  });
  it("employers see none", async () => {
    expect(await as(SATO, (q) => count(q, "topic_counts"))).toBe(0);
  });
  it("service-only functions are not callable by users", async () => {
    await expect(as(MUNI, (q) => q.query("select app.refresh_topic_counts()"))).rejects.toThrow(/permission denied/);
  });
});

describe("delete my data (FR-006)", () => {
  it("removes every row linked to the worker", async () => {
    await as(LINH, (q) => q.query("select app.delete_my_data()"));
    const left = await runAs(db, "service", async (q) => {
      const t = ["chat_messages", "offers", "comparisons", "swap_requests", "consents", "pulse_participation"];
      let n = 0;
      for (const table of t) {
        const col = table === "swap_requests" ? "worker_id" : "user_id";
        n += Number((await q.query<{ n: number }>(`select count(*)::int n from ${table} where ${col} = $1`, [LINH])).rows[0].n);
      }
      n += Number((await q.query<{ n: number }>(`select count(*)::int n from profiles where user_id = $1`, [LINH])).rows[0].n);
      n += Number((await q.query<{ n: number }>(`select count(*)::int n from auth.users where id = $1`, [LINH])).rows[0].n);
      return n;
    });
    expect(left).toBe(0);
  });
});
