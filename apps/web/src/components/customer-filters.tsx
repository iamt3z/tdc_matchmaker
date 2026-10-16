"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerStatus } from "@/lib/api/types";
import { STATUS_OPTIONS } from "./status-options";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  status: CustomerStatus | "ALL";
  onStatusChange: (value: CustomerStatus | "ALL") => void;
};

export function CustomerFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: Props) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          placeholder="Search by name, email, or city…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 pl-9"
          aria-label="Search customers"
        />
      </div>
      <Select
        value={status}
        onValueChange={(v) => onStatusChange(v as CustomerStatus | "ALL")}
      >
        <SelectTrigger
          className="h-10 w-full sm:w-52"
          aria-label="Filter by status"
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}