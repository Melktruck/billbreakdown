"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function ShareButton({ billNumber }: { billNumber: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Bill ${billNumber}`, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={handleShare} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer">
      {copied ? (
        <><Check className="h-4 w-4 text-green-500" /><span className="text-green-600 dark:text-green-400">Copied!</span></>
      ) : (
        <><Share2 className="h-4 w-4" />Share</>
      )}
    </button>
  );
}
