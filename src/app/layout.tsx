import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "BillBreakdown — Legislation in Plain English",
    template: "%s | BillBreakdown",
  },
  description:
    "Understand federal and state legislation in plain English. BillBreakdown uses AI to summarize bills from Congress and Rhode Island so anyone can stay informed.",
  keywords: ["legislation", "bills", "laws", "Congress", "state legislature", "government"],
  openGraph: {
    title: "BillBreakdown — Legislation in Plain English",
    description: "Federal and state bills explained in simple language.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Navigation />
          <main className="min-h-screen bg-gray-50 dark:bg-gray-950">{children}</main>
          <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
                  <Link href="/" className="font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    BillBreakdown
                  </Link>
                  <span className="hidden sm:inline">&middot;</span>
                  <span>A nonpartisan, citizen-first project</span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  Data from{" "}
                  <a href="https://congress.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-300">Congress.gov</a>
                  {" & "}
                  <a href="https://legiscan.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-300">LegiScan</a>
                  . AI summaries are informational only.
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
