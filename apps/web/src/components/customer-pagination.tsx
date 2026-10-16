"use client";

import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function CustomerPagination({
  page,
  totalPages,
  total,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div className="mt-5 flex flex-col items-start justify-between gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center">
      <span>
        Page {page} of {Math.max(1, totalPages)} · {total}{" "}
        {total === 1 ? "person" : "people"}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrevious}>
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= (totalPages || 1)}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}