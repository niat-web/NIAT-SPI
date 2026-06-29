import { createSign } from "crypto";

const PROJECT_ID = process.env.BQ_PROJECT_ID || "kossip-helpers";
const LOCATION = process.env.BQ_LOCATION || "asia-south1";

export const TABLE =
  "`kossip-helpers.niat_post_onboarding_engagement_ai_analytics_workspace.z_niat_student_session_wise_attendance_details`";

export const REQUIRED_PCT = 80;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.token;
  }

  const raw = process.env.BIGQUERY_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("BIGQUERY_SERVICE_ACCOUNT_JSON not set");

  const sa = JSON.parse(raw) as { client_email: string; private_key: string };

  const base64url = (str: string) =>
    Buffer.from(str).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/bigquery.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${claim}`);
  const sig = sign
    .sign(sa.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${header}.${claim}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`Failed to get BQ token: ${data.error ?? "unknown"}`);
  }

  cachedToken = { token: data.access_token, expiresAt: (now + 3600) * 1000 };
  return data.access_token;
}

interface BQRow {
  f: { v: string | null }[];
}
interface BQResponse {
  schema?: { fields: { name: string; type: string }[] };
  rows?: BQRow[];
  error?: { message: string; code: number };
  totalBytesProcessed?: string;
}

// Named query parameters (BUG-5): pass { name: value } and reference @name in
// SQL. Strings/numbers are auto-typed; arrays become ARRAY<STRING>.
export type BQParam = string | number | string[];

function toQueryParameter(name: string, value: BQParam) {
  if (Array.isArray(value)) {
    return {
      name,
      parameterType: { type: "ARRAY", arrayType: { type: "STRING" } },
      parameterValue: { arrayValues: value.map((v) => ({ value: String(v) })) },
    };
  }
  const type = typeof value === "number" ? "INT64" : "STRING";
  return { name, parameterType: { type }, parameterValue: { value: String(value) } };
}

export async function bqQuery(
  sql: string,
  params?: Record<string, BQParam>,
  location?: string,
): Promise<Record<string, string | null>[]> {
  const token = await getAccessToken();

  const queryParameters = params
    ? Object.entries(params).map(([k, v]) => toQueryParameter(k, v))
    : undefined;

  const res = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT_ID}/queries`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: sql,
        useLegacySql: false,
        timeoutMs: 30000,
        location: location ?? LOCATION,
        ...(queryParameters ? { parameterMode: "NAMED", queryParameters } : {}),
      }),
    },
  );

  const data = (await res.json()) as BQResponse;
  if (data.error) {
    throw new Error(`BigQuery error: ${data.error.message}`);
  }
  if (!data.rows || !data.schema) return [];

  const fields = data.schema.fields.map((f) => f.name);
  return data.rows.map((row) => {
    const obj: Record<string, string | null> = {};
    fields.forEach((field, i) => {
      obj[field] = row.f[i]?.v ?? null;
    });
    return obj;
  });
}

// ── Metadata / explorer helpers (BigQuery REST, read-only) ────────────
const API_BASE = `https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT_ID}`;

async function bqGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? "BigQuery API error");
  return data as T;
}

export async function listDatasets(): Promise<{ id: string; location: string }[]> {
  const data = await bqGet<{ datasets?: { datasetReference: { datasetId: string }; location?: string }[] }>(
    `/datasets?all=true&maxResults=1000`,
  );
  return (data.datasets ?? [])
    .map((d) => ({ id: d.datasetReference.datasetId, location: d.location ?? "" }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function listTables(datasetId: string): Promise<{ id: string; type: string; rows?: string }[]> {
  const data = await bqGet<{ tables?: { tableReference: { tableId: string }; type?: string; numRows?: string }[] }>(
    `/datasets/${encodeURIComponent(datasetId)}/tables?maxResults=1000`,
  );
  return (data.tables ?? [])
    .map((t) => ({ id: t.tableReference.tableId, type: t.type ?? "TABLE", rows: t.numRows }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function getTablePreview(
  datasetId: string, tableId: string, maxResults = 50,
): Promise<{ fields: string[]; rows: (string | null)[][]; totalRows: string; type: string }> {
  const ds = encodeURIComponent(datasetId);
  const tb = encodeURIComponent(tableId);
  const meta = await bqGet<{ schema?: { fields: { name: string }[] }; numRows?: string; type?: string; location?: string }>(
    `/datasets/${ds}/tables/${tb}`,
  );
  const fields = (meta.schema?.fields ?? []).map((f) => f.name);
  const type = meta.type ?? "TABLE";
  const limit = Math.min(maxResults, 200);

  // Real tables: tabledata.list is free (no query cost).
  if (type === "TABLE") {
    const data = await bqGet<{ rows?: { f: { v: string | null }[] }[] }>(
      `/datasets/${ds}/tables/${tb}/data?maxResults=${limit}`,
    );
    const rows = (data.rows ?? []).map((r) => r.f.map((c) => c?.v ?? null));
    return { fields, rows, totalRows: meta.numRows ?? String(rows.length), type };
  }

  // Views / materialized views / external: must run a bounded query.
  const objs = await bqQuery(
    `SELECT * FROM \`${PROJECT_ID}.${datasetId}.${tableId}\` LIMIT ${limit}`,
    undefined,
    meta.location,
  );
  const cols = fields.length ? fields : Object.keys(objs[0] ?? {});
  const rows = objs.map((o) => cols.map((c) => o[c] ?? null));
  return { fields: cols, rows, totalRows: meta.numRows ?? String(rows.length), type };
}

// ── Input safety helpers ──────────────────────────────────────────────
export function sanitizeLike(s: string): string {
  return s.replace(/[%_\\]/g, (c) => `\\${c}`);
}
export function escapeStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
export function validateStudentId(id: string): boolean {
  return /^[a-zA-Z0-9_\-]{4,64}$/.test(id);
}
export function pct(present: number, total: number): number {
  return total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
}
