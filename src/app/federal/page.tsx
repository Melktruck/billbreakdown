import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, Vote, FileCheck, FileText, Scale } from "lucide-react";
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
    const [total, statusCounts, chamberCounts] = await Promise.all([
      db.bill.count({ where: { level: "FEDERAL" } }),
      db.bill.groupBy({ by: ["status"], where: { level: "FEDERAL" }, _count: { id: true } }),
      db.bill.groupBy({ by: ["chamber"], where: { level: "FEDERAL" }, _count: { id: true } }),
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
  { key: "", label: "All Bills" },
  { key: "in_progress", label: "In Progress" },
  { key: "SIGNED", label: "Signed Into Law" },
];

const CHAMBER_TABS = [
  { key: "", label: "Both Chambers" },
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Landmark className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">U.S. Congress Bills</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-10">House and Senate legislation explained in plain English — 119th Congress.</p>
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Bills</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inProgress.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">In Progress</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.passed.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Passed</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.enacted.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1"><Scale className="h-3 w-3" />Signed Into Law</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <Link key={tab.key} href={`/federal?status=${tab.key}${chamberParam ? `&chamber=${chamberParam}` : ""}`}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              statusParam === tab.key
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-600"
            }`}>
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {CHAMBER_TABS.map((tab) => (
          <Link key={tab.key} href={`/federal?${statusParam ? `status=${statusParam}&` : ""}chamber=${tab.key}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              chamberParam === tab.key
                ? "bg-gray-800 dark:bg-gray-100 border-gray-800 dark:border-gray-100 text-white dark:text-gray-900"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
            }`}>
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mb-6">
        <Suspense><BillSearch defaultLevel="FEDERAL" /></Suspense>
      </div>

      {filteredBills.length > 0 ? (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Showing {filteredBills.length} federal bill{filteredBills.length !== 1 ? "s" : ""}
            {statusParam === "SIGNED" ? " signed into law" : ""}
            {chamberParam === "HOUSE" ? " from the House" : chamberParam === "SENATE" ? " from the Senate" : ""}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBills.map((bill) => (
              <BillCard key={bill.id} id={bill.id} billNumber={bill.billNumber} title={bill.title}
                shortTitle={bill.shortTitle} state={bill.state} level={bill.level as "FEDERAL" | "STATE"}
                status={bill.status} introducedDate={bill.introducedDate} lastActionDate={bill.lastActionDate}
                lastAction={bill.lastAction} aiSummary={bill.aiSummary} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <Landmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No bills found for this filter.</p>
          <p className="text-sm mt-1"><Link href="/federal" className="text-blue-600 dark:text-blue-400 hover:underline">View all federal bills</Link></p>
        </div>
      )}
    </div>
  );
}
