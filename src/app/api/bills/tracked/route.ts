import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/bills/tracked?ids=id1,id2,id3
export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json({ bills: [] });
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 100);

    if (ids.length === 0) {
      return NextResponse.json({ bills: [] });
    }

    const bills = await db.bill.findMany({
      where: { id: { in: ids } },
      orderBy: { lastActionDate: "desc" },
      select: {
        id: true,
        billNumber: true,
        title: true,
        shortTitle: true,
        state: true,
        level: true,
        status: true,
        chamber: true,
        introducedDate: true,
        lastActionDate: true,
        lastAction: true,
        aiSummary: true,
        sourceUrl: true,
      },
    });

    return NextResponse.json({ bills });
  } catch (error) {
    console.error("Tracked bills API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
