import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "Washington D.C.",
};

export function getStateName(code: string): string {
  return US_STATES[code.toUpperCase()] ?? code;
}

export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    INTRODUCED: "Introduced",
    REFERRED: "Referred",
    COMMITTEE: "In Committee",
    FLOOR: "On Floor",
    PASSED_CHAMBER: "Passed Chamber",
    PASSED_BOTH: "Passed Both Chambers",
    ENROLLED: "Enrolled",
    SIGNED: "Signed into Law",
    VETOED: "Vetoed",
    FAILED: "Failed",
    UNKNOWN: "Unknown",
  };
  return map[status] ?? status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    INTRODUCED: "bg-blue-100 text-blue-800",
    REFERRED: "bg-purple-100 text-purple-800",
    COMMITTEE: "bg-yellow-100 text-yellow-800",
    FLOOR: "bg-orange-100 text-orange-800",
    PASSED_CHAMBER: "bg-green-100 text-green-800",
    PASSED_BOTH: "bg-emerald-100 text-emerald-800",
    ENROLLED: "bg-teal-100 text-teal-800",
    SIGNED: "bg-green-200 text-green-900",
    VETOED: "bg-red-100 text-red-800",
    FAILED: "bg-gray-100 text-gray-800",
    UNKNOWN: "bg-gray-100 text-gray-500",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
}
