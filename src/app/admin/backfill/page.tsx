"use client";

import { useState, useRef, useCallback } from "react";

interface BackfillResult {
  success?: boolean;
  created: number;
  skipped: number;
  errors: number;
  processed: number;
  billsInPage: number;
  totalAvailable: number;
  offset: number;
  nextOffset: number | null;
  done: boolean;
  elapsedMs: number;
  timestamp: string;
  error?: string;
}

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warn";
}

export default function BackfillPage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({
    totalCreated: 0,
    totalSkipped: 0,
    totalErrors: 0,
    currentOffset: 0,
    totalAvailable: 0,
    runsCompleted: 0,
  });

  const pausedRef = useRef(false);
  const abortRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback(
    (message: string, type: LogEntry["type"] = "info") => {
      const time = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, { time, message, type }]);
      setTimeout(
        () => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    },
    []
  );

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret.trim()) {
      setAuthenticated(true);
    }
  };

  const startBackfill = async (startOffset = 0) => {
    setRunning(true);
    setPaused(false);
    pausedRef.current = false;
    abortRef.current = false;

    let offset = startOffset;
    let run = 1;
    const batch = 15;
    const limit = 250;

    addLog(
      `Starting federal backfill from offset ${offset} (batch=${batch}, limit=${limit})`,
      "info"
    );

    while (true) {
      // Check abort
      if (abortRef.current) {
        addLog("Backfill stopped by user.", "warn");
        break;
      }

      // Check pause
      while (pausedRef.current) {
        await new Promise((r) => setTimeout(r, 500));
        if (abortRef.current) break;
      }
      if (abortRef.current) {
        addLog("Backfill stopped by user.", "warn");
        break;
      }

      addLog(`[Run ${run}] Fetching offset=${offset} ...`);

      try {
        const url = `/api/cron/federal-backfill?secret=${encodeURIComponent(
          secret
        )}&offset=${offset}&limit=${limit}&batch=${batch}`;
        const res = await fetch(url, { cache: "no-store" });

        if (!res.ok) {
          const text = await res.text();
          addLog(`HTTP ${res.status}: ${text}`, "error");
          addLog("Retrying in 5s...", "warn");
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }

        const data: BackfillResult = await res.json();

        if (data.error) {
          addLog(`API Error: ${data.error}`, "error");
          addLog("Retrying in 5s...", "warn");
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }

        // Update stats
        setStats((prev) => ({
          totalCreated: prev.totalCreated + data.created,
          totalSkipped: prev.totalSkipped + data.skipped,
          totalErrors: prev.totalErrors + data.errors,
          currentOffset: offset,
          totalAvailable: data.totalAvailable,
          runsCompleted: prev.runsCompleted + 1,
        }));

        const logType = data.created > 0 ? "success" : "info";
        addLog(
          `  Created: ${data.created} | Skipped: ${data.skipped} | Errors: ${data.errors} | ${data.elapsedMs}ms`,
          logType
        );

        // Check if done
        if (data.done || data.nextOffset === null) {
          addLog("BACKFILL COMPLETE! All pages processed.", "success");
          break;
        }

        // Advance offset
        if (data.created === 0 && data.errors === 0) {
          addLog("  All bills in page already in DB, jumping ahead...", "info");
          offset = data.nextOffset;
        } else {
          const processed = data.created + data.skipped + data.errors;
          if (processed < data.billsInPage) {
            addLog("  More new bills in this page, re-running...", "info");
          } else {
            offset = data.nextOffset;
          }
        }

        run++;

        // Brief pause between calls
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        addLog(`Network error: ${String(err)}`, "error");
        addLog("Retrying in 10s...", "warn");
        await new Promise((r) => setTimeout(r, 10000));
      }
    }

    setRunning(false);
  };

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    addLog(
      pausedRef.current ? "Paused. Click Resume to continue." : "Resumed.",
      "warn"
    );
  };

  const stopBackfill = () => {
    abortRef.current = true;
    pausedRef.current = false;
    setPaused(false);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <form
          onSubmit={handleAuth}
          className="bg-gray-900 border border-gray-800 rounded-lg p-8 w-full max-w-sm"
        >
          <h1 className="text-xl font-semibold mb-4">Admin: Federal Backfill</h1>
          <p className="text-gray-400 text-sm mb-4">
            Enter the CRON_SECRET to access the backfill tool.
          </p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="CRON_SECRET"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
          >
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  const progress =
    stats.totalAvailable > 0
      ? (
          ((stats.totalCreated + stats.totalSkipped) /
            stats.totalAvailable) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Federal Bill Backfill</h1>
        <p className="text-gray-400 mb-6">
          Ingests all 119th Congress bills from Congress.gov into the database.
          Runs entirely in your browser — just keep this tab open.
        </p>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Created" value={stats.totalCreated} color="text-green-400" />
          <StatCard label="Skipped (existing)" value={stats.totalSkipped} color="text-gray-400" />
          <StatCard label="Errors" value={stats.totalErrors} color="text-red-400" />
          <StatCard
            label="Total Available"
            value={stats.totalAvailable || "—"}
            color="text-blue-400"
          />
        </div>

        {/* Progress bar */}
        {stats.totalAvailable > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>
                Offset: {stats.currentOffset.toLocaleString()} / {stats.totalAvailable.toLocaleString()}
              </span>
              <span>{progress}% scanned</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(progress), 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          {!running ? (
            <>
              <button
                onClick={() => startBackfill(0)}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors"
              >
                Start from Beginning
              </button>
              {stats.currentOffset > 0 && (
                <button
                  onClick={() => startBackfill(stats.currentOffset)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
                >
                  Resume from Offset {stats.currentOffset.toLocaleString()}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={togglePause}
                className={`px-5 py-2 rounded font-medium transition-colors ${
                  paused
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
              >
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={stopBackfill}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition-colors"
              >
                Stop
              </button>
            </>
          )}
          {!running && logs.length > 0 && (
            <button
              onClick={() => {
                setLogs([]);
                setStats({
                  totalCreated: 0,
                  totalSkipped: 0,
                  totalErrors: 0,
                  currentOffset: 0,
                  totalAvailable: 0,
                  runsCompleted: 0,
                });
              }}
              className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Log output */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 h-[400px] overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">
              Click &quot;Start from Beginning&quot; to begin ingesting federal bills.
              This will page through all ~14,700 bills in the 119th Congress, skipping
              any already in the database.
            </p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600 shrink-0">{log.time}</span>
                <span
                  className={
                    log.type === "success"
                      ? "text-green-400"
                      : log.type === "error"
                      ? "text-red-400"
                      : log.type === "warn"
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        <p className="text-gray-500 text-xs mt-4">
          Tip: Keep this tab open while the backfill runs. You can pause and resume
          at any time. Bills already in the database are skipped instantly.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="text-gray-400 text-sm">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
