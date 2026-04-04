import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  Bookmark,
  Calendar,
  FileText,
  Activity,
  Vote,
} from "lucide-react";
import { db } from "@/lib/db";
import { BillTimeline } from "@/components/BillTimeline";
import { cn, formatStatus, getStateName, getStatusColor } from "@/lib/utils";

interface BillPageProps {
  params: Promise<{ id: string }>;
}

async function getBill(id: string) {
  try {
    return await db.bill.findUnique({
      where: { id },
      include: {
        history: { orderBy: { date: "desc" } },
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

export default async function BillPage({ params }: BillPageProps) {
  const { id } = await params;
  const bill = await getBill(id);
  if (!bill) notFound();

  const sponsors = bill.sponsors as Array<{ name: string; party: string; state?: string }> | null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back */}
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border p-6 md:p-8 mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {bill.billNumber}
          </span>
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full",
              getStatusColor(bill.status)
            )}
          >
            {formatStatus(bill.status)}
          </span>
          {bill.level === "FEDERAL" ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
              Federal
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
              {bill.state ? getStateName(bill.state) : "State"}
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
            {bill.chamber.toLowerCase().replace("_", " ")}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
          {bill.title}
        </h1>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
          {bill.introducedDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Introduced {format(new Date(bill.introducedDate), "MMMM d, yyyy")}
            </span>
          )}
          {bill.lastActionDate && (
            <span className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              Last action {format(new Date(bill.lastActionDate), "MMMM d, yyyy")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          {bill.sourceUrl && (
            <a
              href={bill.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View official bill
            </a>
          )}
          <button
            onClick={() => {}}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <Bookmark className="h-4 w-4" />
            Save bill
          </button>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 md:p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-900">Plain English Summary</h2>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full ml-auto">
            AI-generated
          </span>
        </div>
        {bill.aiSummary ? (
          <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed">
            {bill.aiSummary.split("\n\n").map((paragraph, i) => (
              <p key={i} className={i > 0 ? "mt-4" : ""}>
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            AI summary is being generated. Check back shortly.
          </p>
        )}
        <p className="text-xs text-blue-400 mt-4">
          This summary is AI-generated for informational purposes. Always refer to the official
          bill text for legal accuracy.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Last Action */}
        {bill.lastAction && (
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              Latest Action
            </h3>
            <p className="text-sm text-gray-700">{bill.lastAction}</p>
            {bill.lastActionDate && (
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(bill.lastActionDate), "MMMM d, yyyy")}
              </p>
            )}
          </div>
        )}

        {/* Sponsors */}
        {sponsors && sponsors.length > 0 && (
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-3">
              Sponsor{sponsors.length > 1 ? "s" : ""}
            </h3>
            <div className="space-y-2">
              {sponsors.map((sponsor, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    {sponsor.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{sponsor.name}</span>
                    {sponsor.party && (
                      <span className="text-gray-500 ml-1">({sponsor.party})</span>
                    )}
                    {sponsor.state && (
                      <span className="text-gray-500 ml-1">— {sponsor.state}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Votes */}
      {bill.votes.length > 0 && (
        <div className="bg-white rounded-xl border p-5 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Vote className="h-4 w-4 text-gray-500" />
            Voting Records
          </h3>
          <div className="space-y-3">
            {bill.votes.map((vote) => (
              <div key={vote.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {vote.question ?? "Vote"}
                  </span>
                  <div className="flex gap-2 text-xs">
                    <span className="text-gray-400">{format(new Date(vote.date), "MMM d, yyyy")}</span>
                    {vote.result && (
                      <span
                        className={cn(
                          "font-semibold px-2 py-0.5 rounded-full",
                          vote.result.toLowerCase().includes("pass")
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {vote.result}
                      </span>
                    )}
                  </div>
                </div>
                {(vote.yeas != null || vote.nays != null) && (
                  <div className="flex gap-4 text-sm">
                    {vote.yeas != null && (
                      <span className="text-green-600 font-medium">Yea: {vote.yeas}</span>
                    )}
                    {vote.nays != null && (
                      <span className="text-red-600 font-medium">Nay: {vote.nays}</span>
                    )}
                    {vote.present != null && (
                      <span className="text-gray-500">Present: {vote.present}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {bill.history.length > 0 && (
        <div className="bg-white rounded-xl border p-5 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            Legislative History
          </h3>
          <BillTimeline
            events={bill.history.map((h) => ({
              id: h.id,
              date: h.date,
              action: h.action,
              chamber: h.chamber,
            }))}
          />
        </div>
      )}

      {/* Subjects */}
      {bill.subjects && bill.subjects.length > 0 && (
        <div className="bg-white rounded-xl border p-5 mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {bill.subjects.map((subject) => (
              <Link
                key={subject}
                href={`/search?q=${encodeURIComponent(subject)}`}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
              >
                {subject}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
