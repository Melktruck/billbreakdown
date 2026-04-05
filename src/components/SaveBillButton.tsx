"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";

interface SaveBillButtonProps {
  billId: string;
  billNumber: string;
}

export function SaveBillButton({ billId, billNumber }: SaveBillButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedBills") || "[]");
    setSaved(saved.includes(billId));
  }, [billId]);

  const toggle = () => {
    const current: string[] = JSON.parse(localStorage.getItem("savedBills") || "[]");
    const updated = current.includes(billId)
      ? current.filter((id) => id !== billId)
      : [...current, billId];
    localStorage.setItem("savedBills", JSON.stringify(updated));
    setSaved(!saved);
  };

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
        saved ? "text-blue-600 hover:text-blue-800" : "text-gray-500 hover:text-gray-900"
      }`}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {saved ? "Saved" : "Save bill"}
    </button>
  );
}
