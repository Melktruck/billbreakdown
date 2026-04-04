import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getRecentBills,
  getBillDetail,
  getBillActions,
  mapCongressStatus,
} from "@/lib/congress-api";
import { generateBillSummary } from "@/lib/ai-summary";

// Vercel Cron: runs every 8 hours
// vercel.json: { "crons": [{ "path": "/api/cron/federal", "schedule": "0 */8 * * *" }] }

export async function GET(request: NextRequest) {
  // Secure the cron endpoint
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { created: 0, updated: 0, errors: 0, skipped: 0 };

  try {
    // Fetch recent bills from current Congress (119th)
    const congress = 119;
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore && offset < 200) {
      // cap at 200 bills per run
      const response = await getRecentBills(congress, limit, offset);
      const bills = response.bills ?? [];

      if (bills.length < limit) hasMore = false;

      for (const bill of bills) {
        try {
          const type = bill.type;
          const number = bill.number;
          const externalId = `congress-${congress}-${type}-${number}`;

          const existing = await db.bill.findUnique({
            where: { externalId },
            select: { id: true, updatedAt: true },
          });

          // Skip if updated within last 6 hours
          if (
            existing &&
            new Date().getTime() - existing.updatedAt.getTime() < 6 * 60 * 60 * 1000
          ) {
            results.skipped++;
            continue;
          }

          // Fetch full detail
          const detail = await getBillDetail(congress, type, number);
          const billData = detail.bill;

          const actions = await getBillActions(congress, type, number);
          const actionTexts = (actions.actions ?? []).map((a) => a.text).slice(0, 10);

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

          // Generate AI summary if new or no summary
          let aiSummary: string | undefined;
          let aiSummaryDate: Date | undefined;

          if (!existing || !existing.id) {
            try {
              aiSummary = await generateBillSummary(
                billData.title,
                billData.summaries?.summary?.[0]?.text ?? "",
                actionTexts,
                null
              );
              aiSummaryDate = new Date();
            } catch (aiError) {
              console.error("AI summary error:", aiError);
            }
          }

          const billRecord = {
            externalId,
            source: "congress",
            level: "FEDERAL" as const,
            state: null,
            billNumber: `${type} ${number}`,
            title: billData.title,
            chamber:
              billData.originChamberCode === "H"
                ? "HOUSE"
                : billData.originChamberCode === "S"
                ? "SENATE"
                : ("UNKNOWN" as const),
            status: statusStr as "INTRODUCED" | "REFERRED" | "COMMITTEE" | "FLOOR" | "PASSED_CHAMBER" | "PASSED_BOTH" | "ENROLLED" | "SIGNED" | "VETOED" | "FAILED" | "UNKNOWN",
            introducedDate: billData.introducedDate ? new Date(billData.introducedDate) : null,
            lastActionDate: billData.latestAction?.actionDate
              ? new Date(billData.latestAction.actionDate)
              : null,
            lastAction: billData.latestAction?.text ?? null,
            sponsors: sponsors,
            subjects,
            rawData: billData as object,
            sourceUrl: `https://www.congress.gov/bill/${congress}th-congress/${type.toLowerCase().replace("_", "-")}-bill/${number}`,
            ...(aiSummary ? { aiSummary, aiSummaryDate } : {}),
          };

          if (existing) {
            await db.bill.update({
              where: { externalId },
              data: billRecord,
            });
            results.updated++;
          } else {
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
          }

          // Small delay to be rate-limit friendly
          await new Promise((r) => setTimeout(r, 200));
        } catch (billError) {
          console.error(`Error processing bill:`, billError);
          results.errors++;
        }
      }

      offset += limit;
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Federal cron error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }
}
