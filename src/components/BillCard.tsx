import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Calendar, Sparkles, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatStatus, getStateName, getStatusColor } from "@/lib/utils";

interface BillCardProps {
  id: string; billNumber: string; title: string; shortTitle?: string | null;
  state?: string | null; level: "FEDERAL" | "STATE"; status: string;
  introducedDate?: Date | null; lastActionDate?: Date | null;
  lastAction?: string | null; aiSummary?: string | null;
}

export function BillCard({ id, billNumber, title, shortTitle, state, level, status, introducedDate, lastActionDate, lastAction, aiSummary }: BillCardProps) {
  const displayTitle = shortTitle ?? title;
  const cleanSummary = aiSummary
    ? aiSummary.replace(/^#{1,6}\s+[^\n]*\n*/gm, "").replace(/\*\*/g, "").replace(/\*/g, "").trim()
    : null;
  const teaser = cleanSummary ? (cleanSummary.split(".")[0] + ".").trim() : lastAction ?? null;

  return (
    <Link href={`/bills/${id}`} className="block group">
      <Card className="h-full transition-all group-hover:shadow-md group-hover:border-blue-200 dark:group-hover:border-blue-800 dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                {billNumber}
              </span>
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", getStatusColor(status))}>
                {formatStatus(status)}
              </span>
              {level === "FEDERAL" ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">Federal</span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300">
                  {state ? getStateName(state) : "State"}
                </span>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5" />
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
              {introducedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(introducedDate), "MMM d, yyyy")}
                </span>
              )}
              {lastActionDate && !introducedDate && (
                <span className="flex items-center gap-1">Updated {format(new Date(lastActionDate), "MMM d, yyyy")}</span>
              )}
            </div>
            {aiSummary && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Sparkles className="h-3 w-3" />AI Summary
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
