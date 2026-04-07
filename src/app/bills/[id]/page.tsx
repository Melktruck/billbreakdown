import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Activity,
  Sparkles,
  Users,
  GitBranch,
  CheckCircle2,
  Circle,
  Gavel,
} from "lucide-react";
import { db } from "@/lib/db";
import { BillTimeline } from "@/components/BillTimeline";
import { TrackBillButton } from "@/components/TrackBillButton";
import { ShareButton } from "@/components/ShareButton";
import { cn, formatStatus, getStateName, getStatusColor } from "@/lib/utils";

interface BillPageProps {
  params: Promise<{ id: string }>;
}

async function getBill(id: string) {
  try {
    return await db.bill.findUnique({
      where: { id },
      include: {
        history: { orderBy: { date: "asc" } },
        votes: { orderBy: { date: "desc" } },
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: BillPageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBill(id);
  if (!bill) return { title: "Bill Not Found" };
  return {
    title: `${bill.billNumber}: ${bill.shortTitle ?? bill.title}`,
    description: bill.aiSummary?.slice(0, 160) ?? bill.title,
  };
}

const PROGRESS_STEPS = [
  { key: "INTRODUCED", label: "Introduced" },
  { key: "REFERRED", label: "Referred" },
  { key: "COMMITTEE", label: "Committee" },
  { key: "FLOOR", label: "Floor Vote" },
  { key: "PASSED_CHAMBER", label: "Passed Chamber" },
  { key: "PASSED_BOTH", label: "Passed Both" },
  { key: "ENROLLED", label: "Enrolled" },
  { key: "SIGNED", label: "Signed" },
];

const STATUS_STEP_INDEX: Record<string, number> = {
  INTRODUCED: 0, REFERRED: 1, COMMITTEE: 2, FLOOR: 3,
  PASSED_CHAMBER: 4, PASSED_BOTH: 5, ENROLLED: 6, SIGNED: 7,
  VETOED: 7, FAILED: 3, UNKNOWN: 0,
};

function LegislativeProgress({ status }: { status: string }) {
  const currentStep = STATUS_STEP_INDEX[status] ?? 0;
  const isFailed = status === "FAILED" || status === "VETOED";
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-gray-400" />
        Legislative Progress
      </h3>
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {PROGRESS_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                  isCompleted ? "bg-blue-600 text-white"
                    : isCurrent ? isFailed
                      ? "bg-red-100 dark:bg-red-900/40 border-2 border-red-400 text-red-500"
                      : "bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                </div>
                <span className={cn(
                  "text-[10px] mt-1 text-center whitespace-nowrap font-medium",
                  isCompleted ? "text-blue-600 dark:text-blue-400"
                    : isCurrent ? isFailed ? "text-red-500" : "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-600"
                )}>
                  {isCurrent && isFailed ? (status === "VETOED" ? "Vetoed" : "Failed") : step.label}
                </span>
              </div>
              {idx < PROGRESS_STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1 mx-1 mt-[-14px]", idx < currentStep ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function BillPage({ params }: BillPageProps) {
  const { id } = await params;
  const bill = await getBill(id);
  if (!bill) notFound();

  const sponsors = bill.sponsors as Array<{ name: string; party: string; state?: string; bioguideId?: string }> | null;

  const committeeActions = bill.history.filter((h) =>
    h.action.toLowerCase().includes("referred to") ||
    h.action.toLowerCase().includes("committee on") ||
    h.action.toLowerCase().includes("subcommittee")
  );
  const committees = Array.from(new Set(
    committeeActions.map((h) => {
      const match = h.action.match(/Committee on ([^.;,]+)/i) || h.action.match(/referred to the (.+?)(?: on \d|\.)/i);
      return match ? match[1].trim() : null;
    }).filter(Boolean)
  )) as string[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back nav */}
      <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      {/* Bill header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{bill.billNumber}</span>
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", getStatusColor(bill.status))}>{formatStatus(bill.status)}</span>
          {bill.level === "FEDERAL" ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">Federal</span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300">
              {bill.state ? getStateName(bill.state) : "State"}
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize">
            {bill.chamber.toLowerCase().replace("_", " ")}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">{bill.title}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
          {bill.introducedDate && (
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />Introduced {format(new Date(bill.introducedDate), "MMMM d, yyyy")}</span>
          )}
          {bill.lastActionDate && (
            <span className="flex items-center gap-1.5"><Activity className="h-4 w-4" />Last action {format(new Date(bill.lastActionDate), "MMMM d, yyyy")}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-5">
          {bill.sourceUrl && (
            <a href={bill.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline">
              <ExternalLink className="h-4 w-4" />View official bill
            </a>
          )}
          <TrackBillButton billId={bill.id} billNumber={bill.billNumber} />
          <ShareButton billNumber={bill.billNumber} />
        </div>
      </div>

      {/* Legislative progress */}
      {bill.level === "FEDERAL" && (
        <div className="mb-6"><LegislativeProgress status={bill.status} /></div>
      )}

      {/* AI Summary */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-6 md:p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Plain English Summary</h2>
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full ml-auto">AI-generated</span>
        </div>
        {bill.aiSummary ? (
          <div className="prose prose-blue dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
            {bill.aiSummary.split("\n\n").map((paragraph, i) => {
              if (paragraph.startsWith("## ")) {
                return <h3 key={i} className="text-base font-semibold text-blue-900 dark:text-blue-100 mt-5 mb-2">{paragraph.replace(/^## /, "")}</h3>;
              }
              return <p key={i} className={i > 0 ? "mt-4" : ""}>{paragraph.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 py-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Summary is being generated</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Check back in a few minutes.</p>
            </div>
          </div>
        )}
        <p className="text-xs text-blue-400 dark:text-blue-500 mt-4 pt-4 border-t border-blue-100 dark:border-blue-900">
          This summary is AI-generated for informational purposes. Always refer to the official bill text for legal accuracy.
        </p>
      </div>

      {/* Info cards grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {bill.lastAction && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />Latest Action
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{bill.lastAction}</p>
            {bill.lastActionDate && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{format(new Date(bill.lastActionDate), "MMMM d, yyyy")}</p>}
          </div>
        )}
        {sponsors && sponsors.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />Sponsor{sponsors.length > 1 ? "s" : ""}
            </h3>
            <div className="space-y-2">
              {sponsors.map((sponsor, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    sponsor.party === "R" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    : sponsor.party === "D" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400")}>
                    {sponsor.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{sponsor.name}</span>
                    {sponsor.party && (
                      <span className={cn("ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded",
                        sponsor.party === "R" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : sponsor.party === "D" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400")}>
                        {sponsor.party}
                      </span>
                    )}
                    {sponsor.state && <span className="text-gray-500 dark:text-gray-400 ml-1.5 text-xs">{sponsor.state}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Committees */}
      {committees.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Gavel className="h-4 w-4 text-gray-400" />Committees
          </h3>
          <div className="flex flex-wrap gap-2">
            {committees.map((committee) => (
              <span key={committee} className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
                {committee}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Votes */}
      {bill.votes.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">Vote Records</h3>
          <div className="space-y-3">
            {bill.votes.map((vote) => (
              <div key={vote.id} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{vote.chamber}</p>
                  {vote.date && <p className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(vote.date), "MMMM d, yyyy")}</p>}
                </div>
                <div className="flex gap-3 text-xs font-medium">
                  {vote.yeas != null && <span className="text-green-600 dark:text-green-400">Yea {vote.yeas}</span>}
                  {vote.nays != null && <span className="text-red-600 dark:text-red-400">Nay {vote.nays}</span>}
                  {vote.notVoting != null && vote.notVoting > 0 && <span className="text-gray-400">Not Voting {vote.notVoting}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {bill.history.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4">Legislative History</h3>
          <BillTimeline events={bill.history} />
        </div>
      )}
    </div>
  );
}
