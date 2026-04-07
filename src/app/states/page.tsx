import Link from "next/link";
import type { Metadata } from "next";
import { Globe, ArrowRight, FlaskConical } from "lucide-react";
import { db } from "@/lib/db";
import { getStateName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "State Legislatures",
  description: "Browse Rhode Island state legislature bills explained in plain English.",
};

async function getStateStats() {
  try {
    const results = await db.bill.groupBy({
      by: ["state"],
      where: { level: "STATE", state: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    return results.map((r) => ({
      state: r.state!,
      count: r._count.id,
    }));
  } catch {
    return [];
  }
}

export default async function StatesPage() {
  const stateStats = await getStateStats();

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">State Legislatures</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Browse state bills explained in plain English.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span><span className="font-medium">Beta:</span> Currently tracking Rhode Island. More states coming soon.</span>
        </div>
      </div>

      {stateStats.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No state bills loaded yet</p>
          <p className="text-sm mt-1">The ingestion pipeline will populate this once it runs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl">
          {stateStats.map(({ state, count }) => (
            <Link
              key={state}
              href={`/search?state=${state}&level=STATE`}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group"
            >
              <div>
                <div className="font-mono text-xs font-bold text-gray-400 dark:text-gray-500">{state}</div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{getStateName(state)}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{count.toLocaleString()} bills</div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
