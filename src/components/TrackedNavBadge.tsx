"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export function TrackedNavBadge() {
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
      className="relative flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
    >
      <Bell className="h-4 w-4" />
      <span>Tracked</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center bg-amber-500 text-white text-[10px] font-bold rounded-full px-1">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
