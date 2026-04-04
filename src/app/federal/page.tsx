import { Suspense } from "react";
import type { Metadata } from "next";
import { Landmark } from "lucide-react";
import { BillCard } from "@/components/BillCard";
import { BillSearch } from "@/components/BillSearch";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Federal Bills",
  description: "Browse and search U.S. Congress bills from the House and Senate in plain English.",
};

async function getFederalBills() {
  try {
    return await db.bill.findMany({
      where: { level: "FEDERAL" },
      orderBy: { lastActionDate: "desc" },
      take: 50,
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

export default async function FederalPage() {
  const bills = await getFederalBills();

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Landmark className="h-7 w-7 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">U.S. Congress Bills</h1>
        </div>
        <p className="text-gray-600 ml-10">
          House and Senate legislation explained in plain English.
        </p>
      </div>

      <div className="mb-8">
        <Suspense>
          <BillSearch defaultLevel="FEDERAL" />
        </Suspense>
      </div>

      {bills.length > 0 ? (
        <>
          <p className="text-sm text-gray-500 mb-4">{bills.length} federal bills</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bills.map((bill) => (
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
        </>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Landmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No federal bills loaded yet.</p>
          <p className="text-sm mt-1">The ingestion pipeline will populate this once it runs.</p>
        </div>
      )}
    </div>
  );
}
