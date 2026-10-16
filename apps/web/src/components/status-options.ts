import type { CustomerStatus } from "@/lib/api/types";

export const STATUS_OPTIONS: Array<{
  value: CustomerStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "PROFILE_INCOMPLETE", label: "Profile incomplete" },
  { value: "READY_FOR_MATCHING", label: "Ready for matching" },
  { value: "MATCHES_SUGGESTED", label: "Matches suggested" },
  { value: "INTRODUCTION_SENT", label: "Introduction sent" },
  { value: "AWAITING_FEEDBACK", label: "Awaiting feedback" },
  { value: "ON_HOLD", label: "On hold" },
];