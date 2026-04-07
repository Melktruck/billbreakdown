import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, FileCheck, Scale } from "lucide-react";
import { BillCard } from "@/components/BillCard";
import { BillSearch } from "@/components/BillSearch";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Federal Bills — U.S. Congress",
  description: "Browse and search U.S. Congress bills from the House and Senate explained in plain English.",
};

async function getFederalStats() {
  try {
    const [total, statusCounts] = await Promise.all([
      db.bill.count({ where: { level: "FEDERAL" } }),
      db.bill.groupBy({ by: ["status"], where: { level: "FEDERAL" }, _count: { id: true } }),
    ]);
    const byStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id]));
    const inProgress = (byStatus["INTRODUCED"] ?? 0) + (byStatus["REFERRED"] ?? 0) + (byStatus["COMMITTEE"] ?? 0) + (byStatus["FLOOR"] ?? 0);
    const passed = (byStatus["PASSED_CHAMBER"] ?? 0) + (byStatus["PASSED_BOTH"] ?? 0) + (byStatus["ENROLLED"] ?? 0);
    const enacted = byStatus["SIGNED"] ?? 0;
    return { total, inProgress, passed, enacted };
  } catch {
    return { total: 0, inProgress: 0, passed: 0, enacted: 0 };
  }
}

async function getFederalBills(status?: string, chamber?: string) {
  try {
    const where: Record<string, unknown> = { level: "FEDERAL" };
    if (status) where.status = status;
    if (chamber) where.chamber = chamber;
    return await db.bill.findMany({
      where,
      orderBy: { lastActionDate: "desc" },
      take: 60,
      select: { id: true, billNumber: true, title: true, shortTitle: true, state: true, level: true, status: true, introducedDate: true, lastActionDate: true, lastAction: true, aiSummary: true },
    });
  } catch {
    return [];
  }
}

interface FederalPageProps {
  searchParams: Promise<{ status?: string; chamber?: string }>;
}

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "in_progress", label: "In Progress" },
  { key: "SIGNED", label: "Signed" },
];

const CHAMBER_TABS = [
  { key: "", label: "Both" },
  { key: "HOUSE", label: "House" },
  { key: "SENATE", label: "Senate" },
];

export default async function FederalPage({ searchParams }: FederalPageProps) {
  const { status: statusParam = "", chamber: chamberParam = "" } = await searchParams;
  const resolvedStatus = statusParam === "in_progress" ? undefined : statusParam || undefined;

  const [stats, bills] = await Promise.all([
    getFederalStats(),
    getFederalBills(resolvedStatus, chamberParam || undefined),
  ]);

  const filteredBills = statusParam === "in_progress"
    ? bills.filter((b) => ["INTRODUCED", "REFERRED", "COMMITTEE", "FLOOR"].includes(b.status))
    : bills;

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Federal Bills</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          U.S. Congress — House &amp; Senate
          {stats.total > 0 && <span className="ml-2 text-gray-400 dark:text-gray-500">&middot; {stats.total.toLocaleString()} bills tracked</span>}
        </p>
      </div>

      {/* Quick stats */}
      {stats.total > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: "In Progress", value: stats.inProgress, icon: Scale, color: "text-blue-600 dark:text-blue-400" },
            { label: "Passed", value: stats.passed, icon: FileCheck, color: "text-green-600 dark:text-green-400" },
            { label: "Enacted", value: stats.enacted, icon: Landmark, color: "text-emerald-600 dark:text-emerald-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-sm">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="font-semibold text-gray-900 dark:text-gray-100">{value.toLocaleString()}</span>
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/federal?${new URLSearchParams({ ...(tab.key ? { status: tab.key } : {}), ...(chamberParam ? { chamber: chamberParam } : {}) })}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusParam === tab.key
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {CHAMBER_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/federal?${new URLSearchParams({ ...(statusParam ? { status: statusParam } : {}), ...(tab.key ? { chamber: tab.key } : {}) })}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chamberParam === tab.key
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bills grid */}
      {filteredBills.length > 0 ? (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Showing {filteredBills.length} bills
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBills.map((bill) => (
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
        </>
      ) : (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <Landmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No federal bills found.</p>
          <p className="text-sm mt-1">Try removing filters or check back later.</p>
        </div>
      )}
    </div>
  );
}
