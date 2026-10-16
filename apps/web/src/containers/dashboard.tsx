"use client";

import { useMemo, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { CustomerFilters } from "@/components/customer-filters";
import { CustomerMobileList } from "@/components/customer-mobile-list";
import { CustomerPagination } from "@/components/customer-pagination";
import { CustomerSummary } from "@/components/customer-summary";
import { CustomerTable } from "@/components/customer-table";
import { useCustomerList } from "@/hooks/use-customers";
import { getApiErrorMessage } from "@/lib/api/client";
import type { CustomerStatus } from "@/lib/api/types";

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const query = useCustomerList({
    search: search.trim() || undefined,
    status: status === "ALL" ? undefined : status,
    page,
    limit: 20,
  });

  const summary = useMemo(() => {
    const items = query.data?.items ?? [];
    const total = query.data?.pagination.total ?? 0;
    const ready = items.filter((c) => c.status === "READY_FOR_MATCHING").length;
    const suggested = items.filter(
      (c) => c.status === "MATCHES_SUGGESTED",
    ).length;
    return { total, ready, suggested };
  }, [query.data]);

  return (
    <AuthGate>
      <AppShell
        title="Your customers"
        description="Search and open a profile to review biodata, consider matches, and keep notes."
      >
        {query.isSuccess && <CustomerSummary {...summary} />}

        <CustomerFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />

        {query.isLoading && <LoadingState message="Loading your customers…" />}

        {query.isError && (
          <ErrorState
            message={getApiErrorMessage(query.error)}
            onRetry={() => void query.refetch()}
          />
        )}

        {query.isSuccess && query.data.items.length === 0 && (
          <EmptyState
            title="No customers match this view"
            description={
              search || status !== "ALL"
                ? "Try clearing the search or choosing a different status filter."
                : "When customers are assigned to you, they will appear here."
            }
          />
        )}

        {query.isSuccess && query.data.items.length > 0 && (
          <>
            <CustomerMobileList customers={query.data.items} />
            <CustomerTable customers={query.data.items} />
            <CustomerPagination
              page={query.data.pagination.page}
              totalPages={query.data.pagination.totalPages}
              total={query.data.pagination.total}
              onPrevious={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </AppShell>
    </AuthGate>
  );
}