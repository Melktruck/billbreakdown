import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "BillBreakdown — Legislation in Plain English",
    template: "%s | BillBreakdown",
  },
  description:
    "Understand federal and state legislation in plain English. BillBreakdown uses AI to summarize bills from all 50 states and Congress so anyone can stay informed.",
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
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen bg-gray-50">{children}</main>
        <footer className="border-t bg-white py-8 mt-16">
          <div className="container mx-auto px-4 text-center text-sm text-gray-400 space-y-1">
            <p>
              Data sourced from{" "}
              <a
                href="https://congress.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                Congress.gov
              </a>{" "}
              &amp;{" "}
              <a
                href="https://legiscan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                LegiScan
              </a>
              . AI summaries are for informational purposes only.
            </p>
            <p>BillBreakdown is a nonpartisan, citizen-first project.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
