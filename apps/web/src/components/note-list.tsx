"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { useCustomerNotes } from "@/hooks/use-notes";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatDate, formatEnum } from "@/lib/format";

export function NoteList({ customerId }: { customerId: string }) {
  const notesQuery = useCustomerNotes(customerId);

  return (
    <>
      {notesQuery.isLoading && <LoadingState message="Loading notes…" />}
      {notesQuery.isError && (
        <ErrorState
          message={getApiErrorMessage(notesQuery.error)}
          onRetry={() => void notesQuery.refetch()}
        />
      )}
      {notesQuery.isSuccess && notesQuery.data.length === 0 && (
        <EmptyState
          title="No notes yet"
          description="Capture calls, meetings, and follow-ups so the next step is clear."
        />
      )}
      <ul className="space-y-3">
        {notesQuery.data?.map((note) => (
          <li
            key={note.id}
            className="rounded-lg border border-border/70 bg-card px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                <span className="text-muted-foreground">
                  {formatEnum(note.type)}
                </span>
                {" · "}
                {note.subject}
              </p>
              <time className="text-xs text-muted-foreground">
                {formatDate(note.createdAt)}
              </time>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {note.content}
            </p>
            {note.followUpAction && (
              <p className="mt-2 text-xs text-muted-foreground">
                Follow-up: {note.followUpAction}
                {note.followUpAt ? ` · ${formatDate(note.followUpAt)}` : ""}
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}