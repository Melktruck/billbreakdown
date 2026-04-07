import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapCongressStatus } from "@/lib/congress-api";

export const maxDuration = 60;

/**
 * Re-classify bills that are currently marked UNKNOWN.
 * Uses the improved mapCongressStatus function against existing lastAction text.
 * Also checks rawData for latestAction if lastAction is null.
 *
 * GET /api/admin/reclassify?secret=XXX&limit=500
 */
export async function GET(request: NextRequest) {
  const querySecret = request.nextUrl.searchParams.get("secret");
  const secret = process.env.CRON_SECRET;
  if (querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "1000");

  try {
    // Get all UNKNOWN bills
    const unknownBills = await db.bill.findMany({
      where: { status: "UNKNOWN" },
      select: {
        id: true,
        billNumber: true,
        lastAction: true,
        rawData: true,
      },
      take: limit,
    });

    let reclassified = 0;
    let stillUnknown = 0;
    const statusCounts: Record<string, number> = {};

    for (const bill of unknownBills) {
      // Try lastAction first, then dig into rawData
      let actionText = bill.lastAction ?? "";
      if (!actionText && bill.rawData) {
        const raw = bill.rawData as Record<string, unknown>;
        const latestAction = raw.latestAction as { text?: string } | undefined;
        actionText = latestAction?.text ?? "";
      }

      const newStatus = mapCongressStatus(actionText);
      statusCounts[newStatus] = (statusCounts[newStatus] || 0) + 1;

      if (newStatus !== "UNKNOWN") {
        await db.bill.update({
          where: { id: bill.id },
          data: { status: newStatus },
        });
        reclassified++;
      } else {
        stillUnknown++;
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed: unknownBills.length,
      reclassified,
      stillUnknown,
      statusCounts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Reclassify error:", error);
    return NextResponse.json(
      { error: "Reclassify failed", details: String(error) },
      { status: 500 }
    );
  }
}
