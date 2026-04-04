import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatStatus, getStateName, getStatusColor } from "@/lib/utils";

interface BillCardProps {
  id: string;
  billNumber: string;
  title: string;
  shortTitle?: string | null;
  state?: string | null;
  level: "FEDERAL" | "STATE";
  status: string;
  introducedDate?: Date | null;
  lastActionDate?: Date | null;
  lastAction?: string | null;
  aiSummary?: string | null;
}

export function BillCard({
  id,
  billNumber,
  title,
  shortTitle,
  state,
  level,
  status,
  introducedDate,
  lastActionDate,
  lastAction,
  aiSummary,
}: BillCardProps) {
  const displayTitle = shortTitle ?? title;
  const teaser = aiSummary
    ? aiSummary.split(".")[0] + "."
    : lastAction ?? "No summary available yet.";

  return (
    <Link href={`/bills/${id}`} className="block group">
      <Card className="h-full transition-all group-hover:shadow-md group-hover:border-blue-200">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-mono font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {billNumber}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  getStatusColor(status)
                )}
              >
                {formatStatus(status)}
              </span>
              {level === "FEDERAL" ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Federal
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {state ? getStateName(state) : "State"}
                </span>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-0.5" />
          </div>

          <h3 className="font-semibold text-gray-900 leading-snug mb-2 line-clamp-2">
            {displayTitle}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{teaser}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            {introducedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Introduced {format(new Date(introducedDate), "MMM d, yyyy")}
              </span>
            )}
            {state && level === "STATE" && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {getStateName(state)}
              </span>
            )}
            {lastActionDate && (
              <span className="flex items-center gap-1">
                Last action {format(new Date(lastActionDate), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
