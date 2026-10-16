"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/auth-gate";
import { AppShell } from "@/components/app-shell";
import { ErrorState, LoadingState } from "@/components/feedback";
import { CustomerHeader } from "@/components/customer-header";
import { MatchSuggestionsCard } from "@/components/match-suggestions-card";
import { NotesCard } from "@/components/notes-card";
import { ProfileCard } from "@/components/profile-card";
import { useCustomer } from "@/hooks/use-customers";
import { useGenerateMatches } from "@/hooks/use-matches";
import { getApiErrorMessage } from "@/lib/api/client";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const customerQuery = useCustomer(id);
  const generate = useGenerateMatches(id);

  const customer = customerQuery.data;
  const canGenerate = Boolean(
    customer &&
      customer.status !== "PROFILE_INCOMPLETE" &&
      customer.status !== "ON_HOLD",
  );

  async function handleGenerate() {
    try {
      const result = await generate.mutateAsync({ limit: 10 });
      toast.success(
        result.length
          ? `${result.length} suggestion${result.length === 1 ? "" : "s"} ready for your review`
          : "No eligible candidates right now — profiles or preferences may need updating",
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AuthGate>
      <AppShell>
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to customers
          </Link>
        </div>

        {customerQuery.isLoading && <LoadingState message="Loading profile…" />}

        {customerQuery.isError && (
          <ErrorState
            message={getApiErrorMessage(customerQuery.error)}
            onRetry={() => void customerQuery.refetch()}
          />
        )}

        {customer && (
          <div className="space-y-8">
            <CustomerHeader
              customer={customer}
              canGenerate={canGenerate}
              isGenerating={generate.isPending}
              onGenerate={() => void handleGenerate()}
            />
            <ProfileCard customer={customer} />
            <MatchSuggestionsCard customerId={id} canGenerate={canGenerate} />
            <NotesCard customerId={id} />
          </div>
        )}
      </AppShell>
    </AuthGate>
  );
}