import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, BookOpen, Clock, Landmark, Globe, TrendingUp } from "lucide-react";
import { BillCard } from "@/components/BillCard";
import { db } from "@/lib/db";
import { formatStatus } from "@/lib/utils";

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

async function getActivitySnapshot() {
  try {
    const [total, recentlyUpdated, statusCounts] = await Promise.all([
      db.bill.count(),
      db.bill.count({
        where: {
          lastActionDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      db.bill.groupBy({
        by: ["status"],
        _count: { status: true },
        orderBy: { _count: { status: "desc" } },
        take: 6,
      }),
    ]);
    return { total, recentlyUpdated, statusCounts };
  } catch {
    return { total: 0, recentlyUpdated: 0, statusCounts: [] };
  }
}

function getStatusDot(status: string) {
  const map: Record<string, string> = {
    INTRODUCED: "bg-blue-400", COMMITTEE: "bg-yellow-400", PASSED: "bg-green-400",
    PASSED_CHAMBER: "bg-green-400", PASSED_BOTH: "bg-green-500",
    SIGNED: "bg-emerald-500", VETOED: "bg-red-400", FAILED: "bg-gray-400",
    ENROLLED: "bg-teal-400", ENGROSSED: "bg-cyan-400",
  };
  return map[status] ?? "bg-gray-400";
}

export default async function HomePage() {
  const [recentBills, recentLaws, snapshot] = await Promise.all([
    getRecentBills(), getRecentlySignedLaws(), getActivitySnapshot(),
  ]);

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Hero — concise and purposeful */}
      <div className="max-w-2xl mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-3">
          Legislation,{" "}
          <span className="text-blue-600 dark:text-blue-400">explained.</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
          {snapshot.total > 0
            ? `Tracking ${snapshot.total.toLocaleString()} federal and state bills with AI-powered plain English summaries.`
            : "Federal and state bills broken down into plain English so anyone can understand what\u2019s happening in government."}
        </p>
      </div>

      {/* Quick access row */}
      <div className="grid sm:grid-cols-3 gap-3 mb-12">
        <Link
          href="/federal"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group"
        >
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">Federal Bills</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">U.S. Congress</div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 ml-auto flex-shrink-0" />
        </Link>
        <Link
          href="/states"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group"
        >
          <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">State Bills</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Rhode Island + more soon</div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 ml-auto flex-shrink-0" />
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all group"
        >
          <div className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">Browse All</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Search &amp; filter</div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 ml-auto flex-shrink-0" />
        </Link>
      </div>

      {/* Main content: two-column on desktop */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column: bills */}
        <div className="lg:col-span-2 space-y-10">
          {/* Recently Signed Into Law */}
          {recentLaws.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Newly Signed Into Law
                </h2>
                <Link href="/search?status=SIGNED" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Latest Activity
                </h2>
                <Link href="/search" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                  Browse all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

        {/* Right sidebar: activity snapshot */}
        <aside className="space-y-6">
          {/* Activity pulse */}
          {snapshot.total > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                This Week
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {snapshot.recentlyUpdated.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                bills updated in the last 7 days
              </p>
            </div>
          )}

          {/* Status breakdown */}
          {snapshot.statusCounts.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">By Status</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {snapshot.statusCounts.map((s) => (
                  <Link key={s.status} href={`/search?status=${s.status}`} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full ${getStatusDot(s.status)}`} />
                      <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">{formatStatus(s.status)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{s._count.status.toLocaleString()}</span>
                  </Link>
                ))}
              </div>
              <Link href="/search" className="flex items-center justify-center gap-1.5 px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                View all bills <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* About blurb */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">How it works</h3>
            </div>
            <p className="text-sm text-blue-800/80 dark:text-blue-200/70 leading-relaxed">
              We pull bills from Congress.gov and state legislatures, then use AI to generate plain English summaries. Every bill includes its full legislative history, sponsors, and voting records.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
