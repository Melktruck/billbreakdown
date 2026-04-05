import { NextRequest, NextResponse } from "next/server";
import { getRecentBills } from "@/lib/congress-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (request.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // Fetch pages 0, 1, 2 and compare bill numbers
  for (const offset of [0, 20, 40]) {
    const res = await getRecentBills(119, 20, offset);
    results[`offset_${offset}`] = {
      count: res.bills?.length ?? 0,
      pagination: res.pagination,
      billNumbers: res.bills?.map((b) => `${b.type}${b.number}`) ?? [],
    };
  }

  return NextResponse.json(results);
}
