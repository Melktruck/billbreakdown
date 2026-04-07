import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { BillCard } from "@/components/BillCard";
import { BillSearch } from "@/components/BillSearch";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Search Bills",
  description: "Search federal and state legislation by keyword, state, or status.",
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    state?: string;
    status?: string;
    level?: string;
    page?: string;
  }>;
}

async function searchBills(params: {
  q?: string;
  state?: string;
  status?: string;
  level?: string;
  page?: string;
}) {
  const { q, state, status, level, page } = params;
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = 24;

  const where: Prisma.BillWhereInput = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { shortTitle: { contains: q, mode: "insensitive" } },
      { aiSummary: { contains: q, mode: "insensitive" } },
      { billNumber: { contains: q, mode: "insensitive" } },
      { lastAction: { contains: q, mode: "insensitive" } },
    ];
  }

  if (state && state !== "all") where.state = state;
  if (level && level !== "all") where.level = level as "FEDERAL" | "STATE";
  if (status && status !== "all") where.status = status as Prisma.BillWhereInput["status"];

  try {
    const [bills, total] = await Promise.all([
      db.bill.findMany({
        where,
        orderBy: { lastActionDate: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, billNumber: true, title: true, shortTitle: true,
          state: true, level: true, status: true, introducedDate: true,
          lastActionDate: true, lastAction: true, aiSummary: true,
        },
      }),
      db.bill.count({ where }),
    ]);
    return { bills, total, page: pageNum, pageSize };
  } catch {
    return { bills: [], total: 0, page: 1, pageSize };
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { bills, total, page, pageSize } = await searchBills(params);
  const totalPages = Math.ceil(total / pageSize);
  const hasActiveFilters = params.q || params.state || params.status || params.level;

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Browse Bills</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Search and filter federal and state legislation.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <Suspense>
          <BillSearch
            defaultQuery={params.q}
            defaultState={params.state}
            defaultStatus={params.status}
            defaultLevel={params.level}
          />
        </Suspense>
      </div>

      {/* Results */}
      {total > 0 ? (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {total.toLocaleString()} bill{total !== 1 ? "s" : ""} found
            {params.q ? ` for "${params.q}"` : ""}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bills.map((bill) => (
              <BillCard
                key={bill.id}
                id={bill.id}
                billNumber={bill.billNumber}
                title={bill.title}
                shortTitle={bill.shortTitle}
                state={bill.state}
                level={bill.level as "FEDERAL" | "STATE"}
                status={bill.status}
                introducedDate={bill.introducedDate}
                lastActionDate={bill.lastActionDate}
                lastAction={bill.lastAction}
                aiSummary={bill.aiSummary}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {page > 1 && (
                <a
                  href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Previous
                </a>
              )}
              <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <a
                  href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No bills found</p>
          {hasActiveFilters ? (
            <p className="text-sm mt-1">Try different keywords or remove some filters.</p>
          ) : (
            <p className="text-sm mt-1">Bills will appear here once data ingestion runs.</p>
          )}
        </div>
      )}
    </div>
  );
}
