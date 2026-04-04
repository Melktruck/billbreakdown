import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Globe, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getStateName, US_STATES } from "@/lib/utils";

export const metadata: Metadata = {
  title: "State Legislatures",
  description: "Browse bills from all 50 U.S. state legislatures explained in plain English.",
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
  const stateMap = new Map(stateStats.map((s) => [s.state, s.count]));

  const allStates = Object.entries(US_STATES).filter(([code]) => code !== "DC");

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="h-7 w-7 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">State Legislatures</h1>
        </div>
        <p className="text-gray-600 ml-10">
          Select a state to browse its bills in plain English.
        </p>
      </div>

      {stateStats.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No state bills loaded yet.</p>
          <p className="text-sm mt-1">The ingestion pipeline will populate this once it runs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {allStates.map(([code, name]) => {
            const count = stateMap.get(code) ?? 0;
            return (
              <Link
                key={code}
                href={`/search?state=${code}&level=STATE`}
                className={`flex items-center justify-between p-3 rounded-lg border bg-white hover:border-indigo-300 hover:shadow-sm transition-all group ${
                  count === 0 ? "opacity-50" : ""
                }`}
              >
                <div>
                  <div className="font-mono text-xs font-bold text-gray-500">{code}</div>
                  <div className="font-medium text-sm text-gray-900 leading-tight">{name}</div>
                  {count > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">{count.toLocaleString()} bills</div>
                  )}
                </div>
                {count > 0 && (
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-500" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
