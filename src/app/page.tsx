import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Landmark, Globe, TrendingUp, Sparkles, CheckCircle2, BookOpen } from "lucide-react";
import { BillSearch } from "@/components/BillSearch";
import { BillCard } from "@/components/BillCard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getRecentBills() {
  try {
    return await db.bill.findMany({
      where: { aiSummary: { not: null } },
      orderBy: { lastActionDate: "desc" },
      take: 6,
      select: {
        id: true, billNumber: true, title: true, shortTitle: true,
        state: true, level: true, status: true, introducedDate: true,
        lastActionDate: true, lastAction: true, aiSummary: true,
      },
    });
  } catch { return []; }
}

async function getRecentlySignedLaws() {
  try {
    return await db.bill.findMany({
      where: { status: "SIGNED", aiSummary: { not: null } },
      orderBy: { lastActionDate: "desc" },
      take: 3,
      select: {
        id: true, billNumber: true, title: true, shortTitle: true,
        state: true, level: true, status: true, introducedDate: true,
        lastActionDate: true, lastAction: true, aiSummary: true,
      },
    });
  } catch { return []; }
}

async function getStats() {
  try {
    const [total, federal, states, summarized, statusCounts] = await Promise.all([
      db.bill.count(),
      db.bill.count({ where: { level: "FEDERAL" } }),
      db.bill.groupBy({ by: ["state"], where: { level: "STATE", state: { not: null } } }),
      db.bill.count({ where: { aiSummary: { not: null } } }),
      db.bill.groupBy({
        by: ["status"],
        _count: { status: true },
        orderBy: { _count: { status: "desc" } },
        take: 5,
      }),
    ]);
    return { total, federal, stateCount: states.length, summarized, statusCounts };
  } catch {
    return { total: 0, federal: 0, stateCount: 0, summarized: 0, statusCounts: [] };
  }
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    INTRODUCED: "Introduced", COMMITTEE: "In Committee", PASSED: "Passed",
    SIGNED: "Signed into Law", VETOED: "Vetoed", FAILED: "Failed",
    ENROLLED: "Enrolled", ENGROSSED: "Engrossed",
  };
  return map[status] ?? status.charAt(0) + status.slice(1).toLowerCase();
}

function getStatusDot(status: string) {
  const map: Record<string, string> = {
    INTRODUCED: "bg-blue-400", COMMITTEE: "bg-yellow-400", PASSED: "bg-green-400",
    SIGNED: "bg-emerald-500", VETOED: "bg-red-400", FAILED: "bg-gray-400",
    ENROLLED: "bg-teal-400", ENGROSSED: "bg-cyan-400",
  };
  return map[status] ?? "bg-gray-400";
}

export default async function HomePage() {
  const [recentBills, recentLaws, stats] = await Promise.all([
    getRecentBills(), getRecentlySignedLaws(), getStats(),
  ]);
  const summarizedPct = stats.total > 0 ? Math.round((stats.summarized / stats.total) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-full mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered bill summaries
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
          Government Legislation,{" "}
          <span className="text-blue-600 dark:text-blue-400">in Plain English</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          {stats.total > 0
            ? `Search ${stats.total.toLocaleString()} bills from U.S. Congress and Rhode Island — explained so anyone can understand them.`
            : "Search and understand bills from the U.S. Congress and Rhode Island. AI-powered summaries that anyone can read."}
        </p>
        <div className="max-w-3xl mx-auto"><Suspense><BillSearch /></Suspense></div>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-10">
          {[
            { val: stats.total.toLocaleString(), label: "Total Bills", cls: "text-blue-600 dark:text-blue-400" },
            { val: stats.federal.toLocaleString(), label: "Federal", cls: "text-blue-600 dark:text-blue-400" },
            { val: stats.stateCount, label: "States Covered", cls: "text-blue-600 dark:text-blue-400" },
            { val: summarizedPct + "%", label: "AI Summarized", cls: "text-emerald-600 dark:text-emerald-400" },
          ].map(({ val, label, cls }) => (
            <div key={label} className="text-center p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className={`text-2xl font-bold ${cls}`}>{val}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Nav */}
      <div className="grid md:grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
        <Link href="/federal" className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <Landmark className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">U.S. Congress</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">House & Senate bills</div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 ml-auto" />
        </Link>
        <Link href="/states" className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group">
          <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
            <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">Rhode Island</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">State legislature bills</div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 ml-auto" />
        </Link>
      </div>

      {/* Status Breakdown */}
      {stats.statusCounts.length > 0 && (
        <section className="mb-12 max-w-2xl mx-auto">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />Bills by Status
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {stats.statusCounts.map((s) => (
              <Link key={s.status} href={`/search?status=${s.status}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${getStatusDot(s.status)}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">{getStatusLabel(s.status)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s._count.status.toLocaleString()}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500" />
                </div>
              </Link>
            ))}
            <Link href="/search" className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group text-blue-600 dark:text-blue-400">
              <span className="text-sm font-medium">Browse all bills</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>
      )}

      {/* Recently Signed Into Law */}
      {recentLaws.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />Recently Signed Into Law
            </h2>
            <Link href="/search?status=SIGNED" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {recentLaws.map((bill) => (
              <BillCard key={bill.id} id={bill.id} billNumber={bill.billNumber} title={bill.title}
                shortTitle={bill.shortTitle} state={bill.state} level={bill.level as "FEDERAL" | "STATE"}
                status={bill.status} introducedDate={bill.introducedDate} lastActionDate={bill.lastActionDate}
                lastAction={bill.lastAction} aiSummary={bill.aiSummary} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Updated Bills */}
      {recentBills.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />Recently Updated Bills
            </h2>
            <Link href="/search" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">Browse all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBills.map((bill) => (
              <BillCard key={bill.id} id={bill.id} billNumber={bill.billNumber} title={bill.title}
                shortTitle={bill.shortTitle} state={bill.state} level={bill.level as "FEDERAL" | "STATE"}
                status={bill.status} introducedDate={bill.introducedDate} lastActionDate={bill.lastActionDate}
                lastAction={bill.lastAction} aiSummary={bill.aiSummary} />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <Landmark className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2">No bills loaded yet</h3>
          <p className="text-sm">Bills will appear here once the data ingestion pipeline runs.</p>
        </div>
      )}
    </div>
  );
}
