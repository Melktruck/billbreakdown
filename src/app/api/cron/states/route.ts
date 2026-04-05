import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getSessions,
  getMasterList,
  getBill,
  mapLegiScanStatus,
  LEGISCAN_STATES,
} from "@/lib/legiscan-api";
import { generateBillSummary } from "@/lib/ai-summary";

// Vercel Cron: runs every 12 hours
// vercel.json: { "crons": [{ "path": "/api/cron/states", "schedule": "0 */12 * * *" }] }

export const maxDuration = 60;

// Default to Rhode Island for testing; set LEGISCAN_BATCH_STATES env var to expand (e.g. "RI,MA,CT")
const BATCH_STATES = process.env.LEGISCAN_BATCH_STATES?.split(",") ?? ["RI"];

export async function GET(request: NextRequest) {
  // Secure the cron endpoint (header or query param)
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const secret = process.env.CRON_SECRET;
  if (authHeader !== `Bearer ${secret}` && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { created: 0, updated: 0, errors: 0, skipped: 0, states: 0 };

  for (const stateCode of BATCH_STATES) {
    try {
      // Get current session for state
      const sessionsRes = await getSessions(stateCode);
      const sessions = sessionsRes.sessions ?? [];

      // Find current/most recent session
      const currentSession = sessions.find((s) => !s.prior && !s.sine_die) ?? sessions[0];
      if (!currentSession) continue;

      // Get master list of bills for this session
      const masterRes = await getMasterList(currentSession.session_id);
      const masterList = masterRes.masterlist ?? {};

      // Process bills that have changed recently
      const billEntries = Object.values(masterList).slice(0, 30); // Limit per state per run

      for (const entry of billEntries) {
        try {
          const externalId = `legiscan-${stateCode}-${entry.bill_id}`;

          const existing = await db.bill.findUnique({
            where: { externalId },
            select: { id: true, updatedAt: true, aiSummary: true },
          });

          // Skip if updated within last 8 hours and has summary
          if (
            existing?.aiSummary &&
            new Date().getTime() - existing.updatedAt.getTime() < 8 * 60 * 60 * 1000
          ) {
            results.skipped++;
            continue;
          }

          // Fetch full bill detail
          const billRes = await getBill(entry.bill_id);
          const bill = billRes.bill;

          const statusStr = mapLegiScanStatus(bill.status);
          const isStateLevel = stateCode !== "US";

          const sponsors = (bill.sponsors ?? []).map((s) => ({
            name: s.name,
            party: s.party,
          }));

          const subjects = (bill.subjects ?? []).map((s) => s.subject_name);

          const actionTexts = (bill.history ?? []).map((h) => h.action).slice(0, 10);

          // Generate AI summary for new bills
          let aiSummary: string | undefined;
          let aiSummaryDate: Date | undefined;

          if (!existing) {
            try {
              aiSummary = await generateBillSummary(
                bill.title,
                bill.description,
                actionTexts,
                isStateLevel ? stateCode : null
              );
              aiSummaryDate = new Date();
            } catch {
              // Continue without summary
            }
          }

          const billRecord = {
            externalId,
            source: "legiscan",
            level: isStateLevel ? ("STATE" as const) : ("FEDERAL" as const),
            state: isStateLevel ? stateCode : null,
            billNumber: bill.bill_number,
            title: bill.title,
            chamber:
              bill.body?.toUpperCase() === "H" || bill.body?.toLowerCase().includes("house")
                ? ("HOUSE" as const)
                : bill.body?.toUpperCase() === "S" || bill.body?.toLowerCase().includes("senate")
                ? ("SENATE" as const)
                : ("UNKNOWN" as const),
            status: statusStr as "INTRODUCED" | "REFERRED" | "COMMITTEE" | "FLOOR" | "PASSED_CHAMBER" | "PASSED_BOTH" | "ENROLLED" | "SIGNED" | "VETOED" | "FAILED" | "UNKNOWN",
            introducedDate: null,
            lastActionDate: bill.last_action_date ? new Date(bill.last_action_date) : null,
            lastAction: bill.last_action ?? null,
            sponsors,
            subjects,
            rawData: bill as object,
            sourceUrl: bill.state_link ?? bill.url ?? null,
            ...(aiSummary ? { aiSummary, aiSummaryDate } : {}),
          };

          if (existing) {
            await db.bill.update({ where: { externalId }, data: billRecord });
            results.updated++;
          } else {
            const created = await db.bill.create({ data: billRecord });

            // Store history
            const historyItems = (bill.history ?? []).map((h) => ({
              billId: created.id,
              date: new Date(h.date),
              action: h.action,
              chamber:
                h.chamber?.toLowerCase().includes("house")
                  ? ("HOUSE" as const)
                  : h.chamber?.toLowerCase().includes("senate")
                  ? ("SENATE" as const)
                  : ("UNKNOWN" as const),
            }));

            if (historyItems.length > 0) {
              await db.billHistory.createMany({ data: historyItems });
            }

            // Store votes
            const voteItems = (bill.votes ?? []).map((v) => ({
              billId: created.id,
              date: new Date(v.date),
              chamber:
                v.chamber?.toLowerCase().includes("house")
                  ? ("HOUSE" as const)
                  : v.chamber?.toLowerCase().includes("senate")
                  ? ("SENATE" as const)
                  : ("UNKNOWN" as const),
              question: v.desc ?? null,
              result: v.passed ? "Passed" : "Failed",
              yeas: v.yea,
              nays: v.nay,
              present: null,
              notVoting: v.nv,
              rawData: v as object,
            }));

            if (voteItems.length > 0) {
              await db.vote.createMany({ data: voteItems });
            }

            results.created++;
          }

          await new Promise((r) => setTimeout(r, 300));
        } catch (err) {
          console.error(`Error processing LegiScan bill:`, err);
          results.errors++;
        }
      }

      results.states++;
      await new Promise((r) => setTimeout(r, 500));
    } catch (stateError) {
      console.error(`Error processing state ${stateCode}:`, stateError);
      results.errors++;
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
    timestamp: new Date().toISOString(),
  });
}
