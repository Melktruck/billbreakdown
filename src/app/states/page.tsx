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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">State Legislatures</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-10">
          Browse state bills explained in plain English.
        </p>

        {/* Beta notice */}
        <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg max-w-xl">
          <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Beta coverage:</span> Currently tracking Rhode Island. More states coming soon.
          </p>
        </div>
      </div>

      {stateStats.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No state bills loaded yet.</p>
          <p className="text-sm mt-1">The ingestion pipeline will populate this once it runs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
          {stateStats.map(({ state, count }) => (
            <Link
              key={state}
              href={`/search?state=${state}&level=STATE`}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group"
            >
              <div>
                <div className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400">{state}</div>
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
