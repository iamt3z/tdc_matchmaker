"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createNote, listNotes } from "@/lib/api/notes";
import type { CreateNoteInput } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

export function useCustomerNotes(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notes.byCustomer(customerId ?? ""),
    queryFn: () => listNotes(customerId!),
    enabled: Boolean(customerId),
  });
}

export function useCreateNote(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(customerId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notes.byCustomer(customerId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(customerId),
      });
    },
  });
}
