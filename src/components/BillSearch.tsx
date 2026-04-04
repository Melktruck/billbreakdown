"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { US_STATES } from "@/lib/utils";

interface BillSearchProps {
  defaultQuery?: string;
  defaultState?: string;
  defaultStatus?: string;
  defaultLevel?: string;
}

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "INTRODUCED", label: "Introduced" },
  { value: "COMMITTEE", label: "In Committee" },
  { value: "PASSED_CHAMBER", label: "Passed Chamber" },
  { value: "PASSED_BOTH", label: "Passed Both Chambers" },
  { value: "SIGNED", label: "Signed into Law" },
  { value: "VETOED", label: "Vetoed" },
  { value: "FAILED", label: "Failed" },
];

export function BillSearch({
  defaultQuery = "",
  defaultState = "all",
  defaultStatus = "all",
  defaultLevel = "all",
}: BillSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(defaultQuery);
  const [state, setState] = useState(defaultState);
  const [status, setStatus] = useState(defaultStatus);
  const [level, setLevel] = useState(defaultLevel);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (state && state !== "all") params.set("state", state);
    if (status && status !== "all") params.set("status", status);
    if (level && level !== "all") params.set("level", level);

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  function handleClear() {
    setQuery("");
    setState("all");
    setStatus("all");
    setLevel("all");
    router.push("/search");
  }

  const hasFilters = query || (state && state !== "all") || (status && status !== "all") || (level && level !== "all");

  return (
    <form onSubmit={handleSearch} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search bills by keyword, topic, or bill number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-12 text-base"
          />
        </div>
        <Button type="submit" className="h-12 px-6" disabled={isPending}>
          {isPending ? "Searching..." : "Search"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Federal + State</SelectItem>
            <SelectItem value="FEDERAL">Federal Only</SelectItem>
            <SelectItem value="STATE">State Only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {Object.entries(US_STATES).map(([code, name]) => (
              <SelectItem key={code} value={code}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="text-gray-500 hover:text-gray-800"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
