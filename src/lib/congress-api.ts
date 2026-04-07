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
    cache: "no-store", // always fetch fresh — cron runs need live data
  });

  if (!res.ok) {
    throw new Error(`Congress.gov API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getRecentBills(
  congress = 119,
  limit = 50,
  offset = 0,
  fromDateTime?: string
) {
  const params: Record<string, string> = {
    limit: String(limit),
    offset: String(offset),
    // Space gets encoded as "+" by URLSearchParams — Congress.gov expects "updateDate+desc"
    sort: "updateDate desc",
  };
  if (fromDateTime) {
    params.fromDateTime = fromDateTime;
  }
  return congressFetch<{ bills: CongressBill[]; pagination: { count: number; next?: string } }>(
    `/bill/${congress}`,
    params
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
  if (!latestActionText) return "INTRODUCED";
  const text = latestActionText.toLowerCase();

  // Signed into law (public or private)
  if (text.includes("became public law") || text.includes("became private law") || text.includes("signed by president")) return "SIGNED";

  // Vetoed
  if (text.includes("vetoed")) return "VETOED";

  // Enrolled (sent to president)
  if (text.includes("presented to president") || text.includes("sent to president") || text.includes("enrolled bill")) return "ENROLLED";

  // Passed both chambers
  if ((text.includes("passed senate") || text.includes("passed/agreed to in senate")) &&
      (text.includes("passed house") || text.includes("passed/agreed to in house"))) return "PASSED_BOTH";

  // Resolving differences between chambers
  if (text.includes("conference report") || text.includes("resolving differences")) return "PASSED_BOTH";

  // Passed one chamber
  if (text.includes("passed senate") || text.includes("passed house") ||
      text.includes("passed/agreed to in senate") || text.includes("passed/agreed to in house") ||
      text.includes("received in the senate") || text.includes("received in the house")) return "PASSED_CHAMBER";

  // Floor action
  if (text.includes("placed on") && text.includes("calendar")) return "FLOOR";
  if (text.includes("cloture") || text.includes("motion to proceed")) return "FLOOR";
  if (text.includes("rule provides") || text.includes("rules committee")) return "FLOOR";
  if (text.includes("motion to reconsider") || text.includes("laid on the table")) return "FLOOR";
  if (text.includes("agreed to") && !text.includes("referred")) return "FLOOR";

  // Committee stage — ordered to be reported means committee approved it
  if (text.includes("ordered to be reported")) return "COMMITTEE";
  if (text.includes("hearings held") || text.includes("hearing held")) return "COMMITTEE";
  if (text.includes("committee consideration") || text.includes("markup")) return "COMMITTEE";

  // Referred to committee (most common for new bills)
  if (text.includes("referred to")) return "REFERRED";

  // Introduced
  if (text.includes("introduced") || text.includes("sponsor introductory remarks")) return "INTRODUCED";

  // Failed
  if (text.includes("failed") || text.includes("defeated") || text.includes("rejected")) return "FAILED";

  return "UNKNOWN";
}
