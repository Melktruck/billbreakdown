/**
 * Congress.gov API client
 * Docs: https://api.congress.gov/
 */

const BASE_URL = "https://api.congress.gov/v3";
const API_KEY = process.env.CONGRESS_API_KEY;

export interface CongressBill {
  number: string;
  title: string;
  type: string;
  congress: number;
  originChamber: string;
  originChamberCode: string;
  latestAction: {
    actionDate: string;
    text: string;
  };
  updateDate: string;
  url: string;
}

export interface CongressBillDetail {
  bill: {
    number: string;
    title: string;
    type: string;
    congress: number;
    originChamber: string;
    introducedDate: string;
    latestAction: {
      actionDate: string;
      text: string;
    };
    sponsors: Array<{
      bioguideId: string;
      fullName: string;
      party: string;
      state: string;
    }>;
    subjects?: {
      legislativeSubjects: Array<{ name: string }>;
      policyArea?: { name: string };
    };
    summaries?: {
      summary: Array<{ text: string; updateDate: string }>;
    };
    actions?: {
      actions: Array<{
        actionDate: string;
        text: string;
        type: string;
        actionCode?: string;
      }>;
    };
    cboCostEstimates?: unknown[];
    updateDate: string;
  };
}

async function congressFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  if (!API_KEY) throw new Error("CONGRESS_API_KEY is not set");

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("format", "json");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // cache for 1 hour
  });

  if (!res.ok) {
    throw new Error(`Congress.gov API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getRecentBills(congress = 119, limit = 50, offset = 0) {
  return congressFetch<{ bills: CongressBill[]; pagination: { count: number; next?: string } }>(
    `/bill/${congress}`,
    { limit: String(limit), offset: String(offset), sort: "updateDate+desc" }
  );
}

export async function getBillDetail(congress: number, type: string, number: string) {
  return congressFetch<CongressBillDetail>(`/bill/${congress}/${type.toLowerCase()}/${number}`);
}

export async function getBillActions(congress: number, type: string, number: string) {
  return congressFetch<{ actions: Array<{ actionDate: string; text: string; type: string; actionCode?: string }> }>(
    `/bill/${congress}/${type.toLowerCase()}/${number}/actions`,
    { limit: "250" }
  );
}

export async function getBillVotes(congress: number, type: string, number: string) {
  // Congress.gov votes are tied to actions; we get them via the actions endpoint
  return congressFetch<{ actions: Array<{ actionDate: string; text: string; recordedVotes?: Array<{ rollNumber: number; chamber: string; date: string; url: string }> }> }>(
    `/bill/${congress}/${type.toLowerCase()}/${number}/actions`,
    { limit: "250" }
  );
}

export function mapCongressStatus(latestActionText: string): string {
  const text = latestActionText.toLowerCase();
  if (text.includes("became public law") || text.includes("signed by president")) return "SIGNED";
  if (text.includes("vetoed")) return "VETOED";
  if (text.includes("passed senate") && text.includes("passed house")) return "PASSED_BOTH";
  if (text.includes("passed senate") || text.includes("passed house")) return "PASSED_CHAMBER";
  if (text.includes("placed on") && text.includes("calendar")) return "FLOOR";
  if (text.includes("referred to the committee") || text.includes("referred to committee")) return "REFERRED";
  if (text.includes("introduced")) return "INTRODUCED";
  return "UNKNOWN";
}
