import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [total, summarized, byLevel, byStatus] = await Promise.all([
      db.bill.count(),
      db.bill.count({ where: { aiSummary: { not: null } } }),
      db.bill.groupBy({
        by: ["level"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      db.bill.groupBy({
        by: ["status"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    // Also get summarized counts by level
    const [summarizedFederal, summarizedState] = await Promise.all([
      db.bill.count({ where: { aiSummary: { not: null }, level: "FEDERAL" } }),
      db.bill.count({ where: { aiSummary: { not: null }, level: "STATE" } }),
    ]);

    const federalTotal = byLevel.find((l) => l.level === "FEDERAL")?._count.id ?? 0;
    const stateTotal = byLevel.find((l) => l.level === "STATE")?._count.id ?? 0;

    return NextResponse.json({
      total,
      summarized,
      unsummarized: total - summarized,
      percentage: total > 0 ? Math.round((summarized / total) * 1000) / 10 : 0,
      byLevel: {
        federal: { total: federalTotal, summarized: summarizedFederal, percentage: federalTotal > 0 ? Math.round((summarizedFederal / federalTotal) * 1000) / 10 : 0 },
        state: { total: stateTotal, summarized: summarizedState, percentage: stateTotal > 0 ? Math.round((summarizedState / stateTotal) * 1000) / 10 : 0 },
      },
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
