"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

interface TrackedNavBadgeProps {
  compact?: boolean;
}

export function TrackedNavBadge({ compact }: TrackedNavBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => {
      const saved: string[] = JSON.parse(localStorage.getItem("savedBills") || "[]");
      setCount(saved.length);
    };
    update();
    window.addEventListener("tracked-bills-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("tracked-bills-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <Link
      href="/tracked"
      className="relative p-2 rounded-md text-gray-500 hover:text-blue-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Tracked bills${count > 0 ? ` (${count})` : ""}`}
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full px-0.5 leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
