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
    INTRODUCED:     "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    REFERRED:       "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    COMMITTEE:      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    FLOOR:          "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    PASSED_CHAMBER: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    PASSED_BOTH:    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    ENROLLED:       "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
    SIGNED:         "bg-green-200 text-green-900 dark:bg-green-900/50 dark:text-green-200",
    VETOED:         "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    FAILED:         "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    UNKNOWN:        "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  return map[status] ?? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
}
