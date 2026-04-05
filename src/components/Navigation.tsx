import Link from "next/link";
import { Landmark, Search, FileText, Globe } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

export function Navigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-700 dark:text-blue-400">
          <Landmark className="h-6 w-6" />
          <span>BillBreakdown</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
          <Link
            href="/federal"
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            <Landmark className="h-4 w-4" />
            Federal
          </Link>
          <Link
            href="/states"
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            <Globe className="h-4 w-4" />
            Rhode Island
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Browse All
          </Link>
          <DarkModeToggle />
        </nav>

        {/* Mobile nav */}
        <nav className="flex md:hidden items-center gap-4 text-sm">
          <Link href="/federal" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">Federal</Link>
          <Link href="/states" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">RI</Link>
          <DarkModeToggle />
        </nav>
      </div>
    </header>
  );
}
