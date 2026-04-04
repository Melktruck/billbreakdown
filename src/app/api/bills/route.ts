import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  q: z.string().optional(),
  state: z.string().optional(),
  status: z.string().optional(),
  level: z.enum(["FEDERAL", "STATE"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(24),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { q, state, status, level, page, limit } = parsed.data;

    const where: Prisma.BillWhereInput = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { shortTitle: { contains: q, mode: "insensitive" } },
        { aiSummary: { contains: q, mode: "insensitive" } },
        { billNumber: { contains: q, mode: "insensitive" } },
      ];
    }
    if (state) where.state = state;
    if (level) where.level = level;
    if (status) where.status = status as Prisma.BillWhereInput["status"];

    const [bills, total] = await Promise.all([
      db.bill.findMany({
        where,
        orderBy: { lastActionDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      db.bill.count({ where }),
    ]);

    return NextResponse.json({
      bills,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Bills API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
