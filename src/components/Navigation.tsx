"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, Search, Bell, Menu, X } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { TrackedNavBadge } from "@/components/TrackedNavBadge";
import { SearchBar } from "@/components/SearchBar";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/search", label: "Browse", icon: Search },
  { href: "/federal", label: "Federal", icon: Landmark },
  { href: "/states", label: "States", icon: null },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container mx-auto flex h-14 items-center gap-4 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-gray-100 flex-shrink-0"
        >
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Landmark className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="hidden sm:inline">BillBreakdown</span>
        </Link>

        {/* Search bar — center of header on desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <SearchBar />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {label}
              </Link>
            );
          })}
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
          <TrackedNavBadge />
          <DarkModeToggle />
        </nav>

        {/* Mobile: search + menu */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <TrackedNavBadge compact />
          <DarkModeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-1">
          <div className="pb-3">
            <SearchBar />
          </div>
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/tracked"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            Tracked Bills
          </Link>
        </div>
      )}
    </header>
  );
}
