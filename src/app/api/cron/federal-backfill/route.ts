import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getRecentBills,
  getBillDetail,
  getBillActions,
  mapCongressStatus,
} from "@/lib/congress-api";

export const maxDuration = 60;

/**
 * Federal backfill endpoint — pages through ALL 119th Congress bills.
 *
 * Usage:
 *   /api/cron/federal-backfill?secret=XXX&offset=0&limit=250&batch=30
 *
 * Params:
 *   offset  — Congress.gov API offset to start from (default 0)
 *   limit   — page size per API request, max 250 (default 250)
 *   batch   — max bills to process per invocation before returning (default 30)
 *
 * Returns nextOffset so you can chain calls:
 *   { success, created, updated, skipped, errors, nextOffset, done }
 *
 * Design: no 24-hour skip — processes every bill it hasn't seen yet,
 * and updates existing ones. Keeps delays minimal (150ms) to maximize
 * throughput within the 60s timeout.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const secret = process.env.CRON_SECRET;
  if (authHeader !== `Bearer ${secret}` && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const congress = 119;
  const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0");
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") ?? "250"),
    250
  );
  const batch = parseInt(request.nextUrl.searchParams.get("batch") ?? "30");

  const results = { created: 0, updated: 0, errors: 0, skipped: 0 };
  const startTime = Date.now();
  const TIMEOUT_BUFFER_MS = 50_000; // stop processing at 50s to leave room for response

  try {
    // Fetch one page of bills from Congress.gov sorted by update date
    const response = await getRecentBills(congress, limit, offset);
    const bills = response.bills ?? [];
    const totalAvailable = response.pagination?.count ?? 0;

    let processed = 0;

    for (const bill of bills) {
      // Safety: stop before hitting Vercel's 60s timeout
      if (Date.now() - startTime > TIMEOUT_BUFFER_MS) break;
      // Stop at batch limit
      if (processed >= batch) break;

      try {
        const type = bill.type;
        const number = bill.number;
        const externalId = `congress-${congress}-${type}-${number}`;

        const existing = await db.bill.findUnique({
          where: { externalId },
          select: { id: true },
        });

        // For backfill: skip bills we already have (don't re-fetch detail)
        if (existing) {
          results.skipped++;
          processed++;
          continue;
        }

        // Fetch full detail + actions
        const detail = await getBillDetail(congress, type, number);
        const billData = detail.bill;

        const actions = await getBillActions(congress, type, number);

        const statusStr = mapCongressStatus(
          billData.latestAction?.text ?? bill.latestAction?.text ?? ""
        );

        const sponsors = (billData.sponsors ?? []).map((s) => ({
          name: s.fullName,
          party: s.party,
          state: s.state,
          bioguideId: s.bioguideId,
        }));

        const subjects = [
          ...(billData.subjects?.legislativeSubjects?.map((s) => s.name) ?? []),
          billData.subjects?.policyArea?.name,
        ].filter(Boolean) as string[];

        const billRecord = {
          externalId,
          source: "congress",
          level: "FEDERAL" as const,
          state: null,
          billNumber: `${type} ${number}`,
          title: billData.title,
          chamber:
            billData.originChamber?.toLowerCase().includes("house")
              ? "HOUSE"
              : billData.originChamber?.toLowerCase().includes("senate")
              ? "SENATE"
              : ("UNKNOWN" as const),
          status: statusStr as
            | "INTRODUCED"
            | "REFERRED"
            | "COMMITTEE"
            | "FLOOR"
            | "PASSED_CHAMBER"
            | "PASSED_BOTH"
            | "ENROLLED"
            | "SIGNED"
            | "VETOED"
            | "FAILED"
            | "UNKNOWN",
          introducedDate: billData.introducedDate
            ? new Date(billData.introducedDate)
            : null,
          lastActionDate: billData.latestAction?.actionDate
            ? new Date(billData.latestAction.actionDate)
            : null,
          lastAction: billData.latestAction?.text ?? null,
          sponsors,
          subjects,
          rawData: billData as object,
          sourceUrl: `https://www.congress.gov/bill/${congress}th-congress/${type
            .toLowerCase()
            .replace("_", "-")}-bill/${number}`,
        };

        const created = await db.bill.create({ data: billRecord });

        // Store action history
        const historyItems = (actions.actions ?? []).map((action) => ({
          billId: created.id,
          date: new Date(action.actionDate),
          action: action.text,
          chamber:
            action.type === "Floor"
              ? ("HOUSE" as const)
              : ("UNKNOWN" as const),
          actionCode: action.actionCode,
        }));

        if (historyItems.length > 0) {
          await db.billHistory.createMany({ data: historyItems });
        }

        results.created++;
        processed++;

        // Rate-limit friendly delay (Congress.gov allows ~1 req/sec)
        await new Promise((r) => setTimeout(r, 150));
      } catch (billError) {
        console.error(
          `Error processing bill ${bill.type} ${bill.number}:`,
          billError
        );
        results.errors++;
        processed++;
      }
    }

    // Calculate next offset for chaining
    const nextOffset = offset + limit;
    const done = bills.length < limit || nextOffset >= totalAvailable;

    return NextResponse.json({
      success: true,
      ...results,
      processed,
      billsInPage: bills.length,
      totalAvailable,
      offset,
      nextOffset: done ? null : nextOffset,
      done,
      elapsedMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Federal backfill error:", error);
    return NextResponse.json(
      { error: "Backfill failed", details: String(error) },
      { status: 500 }
    );
  }
}
