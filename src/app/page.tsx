import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Landmark, Globe, TrendingUp } from "lucide-react";
import { BillSearch } from "@/components/BillSearch";
import { BillCard } from "@/components/BillCard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getRecentBills() {
  try {
    return await db.bill.findMany({
      orderBy: { lastActionDate: "desc" },
      take: 6,
      select: {
        id: true,
        billNumber: true,
        title: true,
        shortTitle: true,
        state: true,
        level: true,
        status: true,
        introducedDate: true,
        lastActionDate: true,
        lastAction: true,
        aiSummary: true,
      },
    });
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const [total, federal, states] = await Promise.all([
      db.bill.count(),
      db.bill.count({ where: { level: "FEDERAL" } }),
      db.bill.groupBy({ by: ["state"], where: { level: "STATE", state: { not: null } } }),
    ]);
    return { total, federal, stateCount: states.length };
  } catch {
    return { total: 0, federal: 0, stateCount: 0 };
  }
}

export default async function HomePage() {
  const [recentBills, stats] = await Promise.all([getRecentBills(), getStats()]);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Government Legislation,{" "}
          <span className="text-blue-600">in Plain English</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Search and understand bills from all 50 states and the U.S. Congress.
          AI-powered summaries that anyone can read.
        </p>

        <div className="max-w-3xl mx-auto">
          <Suspense>
            <BillSearch />
          </Suspense>
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-12">
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{stats.total.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Total Bills</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{stats.federal.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Federal</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{stats.stateCount}</div>
            <div className="text-xs text-gray-500 mt-1">States Covered</div>
          </div>
        </div>
      )}

      {/* Quick Nav */}
      <div className="grid md:grid-cols-3 gap-4 mb-12">
        <Link
          href="/federal"
          className="flex items-center gap-4 p-5 bg-white rounded-xl border hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Landmark className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 group-hover:text-blue-700">
              U.S. Congress
            </div>
            <div className="text-sm text-gray-500">House &amp; Senate bills</div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 ml-auto" />
        </Link>

        <Link
          href="/states"
          className="flex items-center gap-4 p-5 bg-white rounded-xl border hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Globe className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 group-hover:text-blue-700">
              State Legislatures
            </div>
            <div className="text-sm text-gray-500">All 50 states</div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 ml-auto" />
        </Link>

        <Link
          href="/search?status=SIGNED"
          className="flex items-center gap-4 p-5 bg-white rounded-xl border hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 group-hover:text-blue-700">
              Recently Signed
            </div>
            <div className="text-sm text-gray-500">New laws</div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 ml-auto" />
        </Link>
      </div>

      {/* Recent Bills */}
      {recentBills.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recently Updated Bills</h2>
            <Link href="/search" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Browse all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBills.map((bill) => (
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
        </section>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <Landmark className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2">No bills loaded yet</h3>
          <p className="text-sm">
            Bills will appear here once the data ingestion pipeline runs.
          </p>
        </div>
      )}
    </div>
  );
}
