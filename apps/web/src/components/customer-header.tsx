"use client";

import { Loader2, Sparkles } from "lucide-react";
import { CustomerStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/lib/api/types";
import { formatEnum } from "@/lib/format";

type Props = {
  customer: Customer;
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
};

export function CustomerHeader({
  customer,
  canGenerate,
  isGenerating,
  onGenerate,
}: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {customer.firstName} {customer.lastName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatEnum(customer.gender)} · {customer.location.city},{" "}
          {customer.location.country}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CustomerStatusBadge status={customer.status} />
          <span className="text-xs text-muted-foreground">
            Verification: {formatEnum(customer.verification.status)}
          </span>
        </div>
      </div>
      <Button
        onClick={onGenerate}
        disabled={isGenerating || !canGenerate}
        className="shrink-0"
        title={
          !canGenerate ? "Profile must be complete and not on hold" : undefined
        }
      >
        {isGenerating ? (
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="mr-2 size-4" aria-hidden />
        )}
        Suggest matches
      </Button>
    </div>
  );
}