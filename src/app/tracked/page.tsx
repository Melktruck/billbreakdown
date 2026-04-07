"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, BellOff, ExternalLink, ArrowRight, Calendar, Sparkles, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn, formatStatus, getStateName, getStatusColor } from "@/lib/utils";

interface TrackedBill {
  id: string;
  billNumber: string;
  title: string;
  shortTitle?: string | null;
  state?: string | null;
  level: "FEDERAL" | "STATE";
  status: string;
  chamber: string;
  introducedDate?: string | null;
  lastActionDate?: string | null;
  lastAction?: string | null;
  aiSummary?: string | null;
  sourceUrl?: string | null;
}

const STORAGE_KEY = "savedBills";

export default function TrackedPage() {
  const [bills, setBills] = useState<TrackedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedIds, setTrackedIds] = useState<string[]>([]);

  const loadTracked = useCallback(async () => {
    const saved: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setTrackedIds(saved);

    if (saved.length === 0) {
      setBills([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/bills/tracked?ids=${saved.join(",")}`);
      const data = await res.json();
      setBills(data.bills ?? []);
    } catch {
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracked();
  }, [loadTracked]);

  const untrack = (billId: string) => {
    const updated = trackedIds.filter((id) => id !== billId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTrackedIds(updated);
    setBills((prev) => prev.filter((b) => b.id !== billId));
    window.dispatchEvent(new CustomEvent("tracked-bills-changed", { detail: updated.length }));
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="h-7 w-7 text-amber-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tracked Bills</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-10">
          Bills you&apos;re following, saved in your browser.
        </p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-24 max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No tracked bills yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Click &ldquo;Track Bill&rdquo; on any bill&apos;s detail page to follow it here.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Browse Bills
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/federal"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Federal Bills
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Tracking {bills.length} bill{bills.length !== 1 ? "s" : ""} — saved in your browser
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bills.map((bill) => {
              const displayTitle = bill.shortTitle ?? bill.title;
              const cleanSummary = bill.aiSummary
                ? bill.aiSummary
                    .replace(/^#{1,6}\s+[^\n]*\n*/gm, "")
                    .replace(/\*\*/g, "")
                    .replace(/\*/g, "")
                    .trim()
                : null;
              const teaser = cleanSummary
                ? (cleanSummary.split(".")[0] + ".").trim()
                : bill.lastAction ?? null;

              return (
                <div
                  key={bill.id}
                  className="relative group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                >
                  <button
                    onClick={() => untrack(bill.id)}
                    title="Stop tracking"
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-amber-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <BellOff className="h-4 w-4" />
                  </button>

                  <Link href={`/bills/${bill.id}`} className="block">
                    <div className="flex flex-wrap gap-1.5 mb-3 pr-8">
                      <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        {bill.billNumber}
                      </span>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", getStatusColor(bill.status))}>
                        {formatStatus(bill.status)}
                      </span>
                      {bill.level === "FEDERAL" ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">Federal</span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300">
                          {bill.state ? getStateName(bill.state) : "State"}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug mb-2 line-clamp-2">{displayTitle}</h3>

                    {teaser ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{teaser}</p>
                    ) : (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Clock className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">AI summary generating…</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                        {bill.introducedDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(bill.introducedDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      {bill.aiSummary && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <Sparkles className="h-3 w-3" />
                          AI Summary
                        </span>
                      )}
                    </div>
                  </Link>

                  {bill.sourceUrl && (
                    <a
                      href={bill.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 hover:underline mt-3"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Official source
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
