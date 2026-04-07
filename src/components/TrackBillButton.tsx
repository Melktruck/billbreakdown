"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";

interface TrackBillButtonProps {
  billId: string;
  billNumber: string;
}

const STORAGE_KEY = "savedBills";

export function TrackBillButton({ billId, billNumber }: TrackBillButtonProps) {
  const [tracked, setTracked] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const saved: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setTracked(saved.includes(billId));
  }, [billId]);

  const toggle = () => {
    const current: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const nowTracked = !tracked;
    const updated = nowTracked
      ? [...current, billId]
      : current.filter((id) => id !== billId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTracked(nowTracked);

    if (nowTracked) {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }

    window.dispatchEvent(new CustomEvent("tracked-bills-changed", { detail: updated.length }));
  };

  return (
    <button
      onClick={toggle}
      title={tracked ? `Untrack ${billNumber}` : `Track ${billNumber}`}
      className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-all ${
        tracked
          ? "bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-600 hover:text-amber-600 dark:hover:text-amber-400"
      } ${pulse ? "scale-110" : "scale-100"}`}
    >
      {tracked ? (
        <>
          <Bell className="h-4 w-4 fill-current" />
          Tracking
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Track Bill
        </>
      )}
    </button>
  );
}
