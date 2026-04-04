/**
 * LegiScan API client
 * Docs: https://legiscan.com/legiscan-api/documentation
 * Covers all 50 states + federal (US Congress)
 */

const BASE_URL = "https://api.legiscan.com/";
const API_KEY = process.env.LEGISCAN_API_KEY;

export interface LegiScanBill {
  bill_id: number;
  change_hash: string;
  session_id: number;
  state: string;
  state_id: number;
  bill_number: string;
  bill_type: string;
  bill_type_id: string;
  body: string;
  body_id: number;
  current_body: string;
  current_body_id: number;
  title: string;
  description: string;
  status: number;
  status_date: string;
  progress: Array<{ date: string; event: number }>;
  last_action_date: string;
  last_action: string;
  sponsors: Array<{
    people_id: number;
    name: string;
    party: string;
  }>;
  subjects: Array<{ subject_id: number; subject_name: string }>;
  url: string;
  state_link: string;
  texts: Array<{ doc_id: number; date: string; type: string; url: string }>;
  votes: Array<{
    roll_id: number;
    date: string;
    desc: string;
    yea: number;
    nay: number;
    nv: number;
    absent: number;
    total: number;
    passed: number;
    chamber: string;
    chamber_id: number;
    url: string;
  }>;
  history: Array<{
    date: string;
    action: string;
    chamber: string;
    chamber_id: number;
    importance: number;
  }>;
}

export interface LegiScanMasterList {
  [billId: string]: {
    bill_id: number;
    number: string;
    change_hash: string;
    url: string;
    status_date: string;
    status: number;
    last_action_date: string;
    last_action: string;
    title: string;
    description: string;
  };
}

async function legiScanFetch<T>(op: string, params?: Record<string, string>): Promise<T> {
  if (!API_KEY) throw new Error("LEGISCAN_API_KEY is not set");

  const url = new URL(BASE_URL);
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("op", op);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`LegiScan API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { status: string; [key: string]: unknown };
  if (data.status !== "OK") {
    throw new Error(`LegiScan API error: ${JSON.stringify(data)}`);
  }

  return data as T;
}

export async function getSessions(state: string) {
  return legiScanFetch<{ status: string; sessions: Array<{ session_id: number; year_start: number; year_end: number; prefile: number; sine_die: number; prior: number; special: number; session_tag: string; session_title: string; session_name: string }> }>(
    "getSessionList",
    { state }
  );
}

export async function getMasterList(sessionId: number) {
  return legiScanFetch<{ status: string; masterlist: LegiScanMasterList }>(
    "getMasterList",
    { id: String(sessionId) }
  );
}

export async function getMasterListRaw(sessionId: number) {
  return legiScanFetch<{ status: string; masterlist: LegiScanMasterList }>(
    "getMasterListRaw",
    { id: String(sessionId) }
  );
}

export async function getBill(billId: number) {
  return legiScanFetch<{ status: string; bill: LegiScanBill }>(
    "getBill",
    { id: String(billId) }
  );
}

// LegiScan status codes to our status
export function mapLegiScanStatus(statusCode: number): string {
  const map: Record<number, string> = {
    1: "INTRODUCED",
    2: "COMMITTEE",
    3: "PASSED_CHAMBER",
    4: "PASSED_BOTH",
    5: "SIGNED",
    6: "VETOED",
    7: "FAILED",
    8: "REFERRED",
  };
  return map[statusCode] ?? "UNKNOWN";
}

// All 50 state codes + DC for LegiScan
export const LEGISCAN_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC", "US", // US = federal Congress
];
