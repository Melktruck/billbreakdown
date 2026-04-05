import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBillSummary } from "@/lib/ai-summary";

// Processes a small batch of bills that are missing AI summaries.
// Designed to fit within Vercel Hobby's 60s function timeout.
// Run after ingestion to backfill summaries, or on a cron schedule.

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const secret = process.env.CRON_SECRET;
  if (authHeader !== `Bearer ${secret}` && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batchSize = parseInt(request.nextUrl.searchParams.get("batch") ?? "5");

  // Find bills without summaries, oldest first
  const bills = await db.bill.findMany({
    where: { aiSummary: null },
    orderBy: { createdAt: "asc" },
    take: batchSize,
    select: {
      id: true,
      title: true,
      state: true,
      level: true,
      history: {
        select: { action: true },
        orderBy: { date: "desc" },
        take: 10,
      },
      rawData: true,
    },
  });

  if (bills.length === 0) {
    return NextResponse.json({ success: true, message: "All bills already have summaries", processed: 0 });
  }

  const results: { processed: number; errors: number; remaining: number; errorDetails: string[] } = { processed: 0, errors: 0, remaining: 0, errorDetails: [] };

  for (const bill of bills) {
    try {
      const raw = bill.rawData as Record<string, unknown> | null;
      const description =
        (raw?.description as string) ??
        (raw?.summaries as { summary?: Array<{ text: string }> })?.summary?.[0]?.text ??
        "";
      const actionTexts = bill.history.map((h) => h.action);
      const stateCode = bill.state ?? null;

      const aiSummary = await generateBillSummary(
        bill.title,
        description,
        actionTexts,
        stateCode
      );

      await db.bill.update({
        where: { id: bill.id },
        data: { aiSummary, aiSummaryDate: new Date() },
      });

      results.processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to summarize bill ${bill.id}:`, msg);
      results.errorDetails.push(`${bill.id}: ${msg}`);
      results.errors++;
    }
  }

  // Count remaining unsummarized bills
  results.remaining = await db.bill.count({ where: { aiSummary: null } });

  return NextResponse.json({ success: true, ...results, timestamp: new Date().toISOString() });
}
