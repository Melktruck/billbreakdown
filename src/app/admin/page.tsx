"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, Sparkles, FileText, Landmark, Globe, ArrowRight } from "lucide-react";

interface Stats {
  total: number;
  summarized: number;
  unsummarized: number;
  percentage: number;
  byLevel: {
    federal: { total: number; summarized: number; percentage: number };
    state: { total: number; summarized: number; percentage: number };
  };
  byStatus: Array<{ status: string; count: number }>;
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    INTRODUCED: "Introduced", COMMITTEE: "In Committee", PASSED: "Passed",
    PASSED_CHAMBER: "Passed Chamber", PASSED_BOTH: "Passed Both",
    SIGNED: "Signed", VETOED: "Vetoed", FAILED: "Failed",
    ENROLLED: "Enrolled", ENGROSSED: "Engrossed", REFERRED: "Referred",
    FLOOR: "Floor Vote", UNKNOWN: "Unknown",
  };
  return map[status] ?? status;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Bill ingestion &amp; AI summary stats
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {stats ? (
        <div className="space-y-6">
          {/* Main summary stat */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Summaries</h2>
            </div>

            {/* Big number */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                {stats.summarized.toLocaleString()}
              </span>
              <span className="text-lg text-gray-400 dark:text-gray-500">
                / {stats.total.toLocaleString()} bills
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
              <div
                className="absolute inset-y-0 left-0 bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.percentage}% summarized</span>
              <span className="text-gray-400 dark:text-gray-500">{stats.unsummarized.toLocaleString()} remaining</span>
            </div>
          </div>

          {/* Breakdown by level */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Landmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Federal</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.byLevel.federal.summarized.toLocaleString()}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  / {stats.byLevel.federal.total.toLocaleString()}
                </span>
              </div>
              <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1">
                <div
                  className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                  style={{ width: `${stats.byLevel.federal.percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{stats.byLevel.federal.percentage}%</span>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">State</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.byLevel.state.summarized.toLocaleString()}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  / {stats.byLevel.state.total.toLocaleString()}
                </span>
              </div>
              <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1">
                <div
                  className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full"
                  style={{ width: `${stats.byLevel.state.percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{stats.byLevel.state.percentage}%</span>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                Bills by Status
              </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.byStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{formatStatus(s.status)}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Link to backfill */}
          <Link
            href="/admin/backfill"
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group"
          >
            <div>
              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">Federal Backfill Tool</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Ingest bills from Congress.gov</div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500" />
          </Link>

          {/* Last updated */}
          {lastUpdated && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              Last refreshed {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      ) : loading ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin opacity-40" />
          <p>Loading stats...</p>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <p>Failed to load stats. Try refreshing.</p>
        </div>
      )}
    </div>
  );
}
