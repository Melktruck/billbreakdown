import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";

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
          <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-8 mt-16">
            <div className="container mx-auto px-4 text-center text-sm text-gray-400 dark:text-gray-500 space-y-1">
              <p>
                Data sourced from{" "}
                <a
                  href="https://congress.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Congress.gov
                </a>{" "}
                &amp;{" "}
                <a
                  href="https://legiscan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-600 dark:hover:text-gray-300"
                >
                  LegiScan
                </a>
                . AI summaries are for informational purposes only.
              </p>
              <p>BillBreakdown is a nonpartisan, citizen-first project.</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
