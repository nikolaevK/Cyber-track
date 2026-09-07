import "server-only";
import fs from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { createClient, type Client, type Row } from "@libsql/client";

export type SpotStatus = "available" | "pending" | "sold";

export interface SpotState {
  spotId: string;
  status: SpotStatus;
  sponsorName: string | null;
  sponsorUrl: string | null;
  logoDataUrl: string | null;
  contactEmail: string | null;
  holdId: string | null;
  pendingUntil: string | null;
  paidAt: string | null;
  updatedAt: string;
}

export interface HoldInput {
  spotId: string;
  holdId: string;
  sponsorName: string;
  sponsorUrl: string;
  logoDataUrl: string | null;
  contactEmail: string;
  pendingUntil: Date;
}

export interface Store {
  list(): Promise<SpotState[]>;
  get(spotId: string): Promise<SpotState | null>;
  /** Atomically place a hold. Returns false when the spot is not available. */
  hold(input: HoldInput): Promise<boolean>;
  complete(holdId: string): Promise<SpotState | null>;
  release(holdId: string): Promise<void>;
  findByHold(holdId: string): Promise<SpotState | null>;
}

/** Expired holds count as available. Applied on read so the DB never needs a sweeper. */
export function effectiveStatus(s: SpotState, now = Date.now()): SpotStatus {
  if (s.status === "pending" && s.pendingUntil && Date.parse(s.pendingUntil) < now) {
    return "available";
  }
  return s.status;
}

/* ------------------------------ SQLite / Turso -------------------------------- */
/* One implementation for both: Turso (libsql://) in production, a local file in development.  */
/* Schema lives in db/schema.sql; timestamps are ISO 8601 UTC strings so they compare lexically. */

const LOCAL_DB = "file:.data/spots.db";

function sqliteStore(url: string, authToken: string | undefined): Store {
  if (url.startsWith("file:")) {
    fs.mkdirSync(path.dirname(url.slice("file:".length)), { recursive: true });
  }
  const client: Client = createClient({ url, authToken });

  let ready: Promise<void> | null = null;
  const ensure = async () => {
    ready ??= (async () => {
      const schema = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
      // Strip comments first, then split: a semicolon inside a comment must not end a statement.
      const statements = schema
        .replace(/--.*$/gm, "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      await client.batch(statements, "write");
    })();
    await ready;
    return client;
  };

  const str = (v: Row[string]) => (v == null ? null : String(v));
  const fromRow = (r: Row): SpotState => ({
    spotId: String(r.spot_id),
    status: String(r.status) as SpotStatus,
    sponsorName: str(r.sponsor_name),
    sponsorUrl: str(r.sponsor_url),
    logoDataUrl: str(r.logo_data_url),
    contactEmail: str(r.contact_email),
    holdId: str(r.hold_id),
    pendingUntil: str(r.pending_until),
    paidAt: str(r.paid_at),
    updatedAt: String(r.updated_at),
  });
  const nowIso = () => new Date().toISOString();

  return {
    async list() {
      const db = await ensure();
      const { rows } = await db.execute("SELECT * FROM spot_states");
      return rows.map(fromRow);
    },
    async get(spotId) {
      const db = await ensure();
      const { rows } = await db.execute({ sql: "SELECT * FROM spot_states WHERE spot_id = ?", args: [spotId] });
      return rows[0] ? fromRow(rows[0]) : null;
    },
    async hold(i) {
      const db = await ensure();
      const { rows } = await db.execute({
        sql: `
          INSERT INTO spot_states
            (spot_id, status, sponsor_name, sponsor_url, logo_data_url, contact_email, hold_id, pending_until, paid_at, updated_at)
          VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, NULL, ?)
          ON CONFLICT (spot_id) DO UPDATE SET
            status = 'pending',
            sponsor_name = excluded.sponsor_name,
            sponsor_url = excluded.sponsor_url,
            logo_data_url = excluded.logo_data_url,
            contact_email = excluded.contact_email,
            hold_id = excluded.hold_id,
            pending_until = excluded.pending_until,
            paid_at = NULL,
            updated_at = excluded.updated_at
          WHERE spot_states.status = 'available'
             OR (spot_states.status = 'pending' AND spot_states.pending_until < excluded.updated_at)
          RETURNING spot_id`,
        args: [i.spotId, i.sponsorName, i.sponsorUrl, i.logoDataUrl, i.contactEmail, i.holdId, i.pendingUntil.toISOString(), nowIso()],
      });
      return rows.length === 1;
    },
    async complete(holdId) {
      const db = await ensure();
      const now = nowIso();
      const { rows } = await db.execute({
        sql: `
          UPDATE spot_states
          SET status = 'sold', paid_at = COALESCE(paid_at, ?), pending_until = NULL, updated_at = ?
          WHERE hold_id = ?
          RETURNING *`,
        args: [now, now, holdId],
      });
      return rows[0] ? fromRow(rows[0]) : null;
    },
    async release(holdId) {
      const db = await ensure();
      await db.execute({
        sql: `
          UPDATE spot_states
          SET status = 'available', sponsor_name = NULL, sponsor_url = NULL, logo_data_url = NULL,
              contact_email = NULL, hold_id = NULL, pending_until = NULL, updated_at = ?
          WHERE hold_id = ? AND status = 'pending'`,
        args: [nowIso(), holdId],
      });
    },
    async findByHold(holdId) {
      const db = await ensure();
      const { rows } = await db.execute({ sql: "SELECT * FROM spot_states WHERE hold_id = ?", args: [holdId] });
      return rows[0] ? fromRow(rows[0]) : null;
    },
  };
}

const globalForStore = globalThis as unknown as { __spotStore?: Store };

export function getStore(): Store {
  if (!globalForStore.__spotStore) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      // Vercel's filesystem is read-only, so a missing database in production would silently show
      // every panel as available and then fail at checkout. Refuse to run instead.
      if (process.env.NODE_ENV === "production") {
        throw new Error("TURSO_DATABASE_URL is not set. Production needs Turso; see README.");
      }
      globalForStore.__spotStore = sqliteStore(LOCAL_DB, undefined);
    } else {
      globalForStore.__spotStore = sqliteStore(url, process.env.TURSO_AUTH_TOKEN);
    }
  }
  return globalForStore.__spotStore;
}

/** Cache tag for the spot list. Every mutation calls revalidateTag(SPOTS_TAG, { expire: 0 }). */
export const SPOTS_TAG = "spots";

/**
 * Spot states for page renders, served from the data cache so a burst of page views is not a
 * burst of database queries. The 60 s revalidate is only a backstop; mutations invalidate the tag.
 */
export const listSpotStates = unstable_cache(() => getStore().list(), ["spot-states"], {
  tags: [SPOTS_TAG],
  revalidate: 60,
});
