import { apiClient } from "./client";
import type { ApiSuccess, CreateNoteInput, CustomerNote } from "./types";

export async function listNotes(customerId: string): Promise<CustomerNote[]> {
  const { data } = await apiClient.get<ApiSuccess<CustomerNote[]>>(
    `/api/customers/${customerId}/notes`,
  );
  return data.data;
}

export async function createNote(
  customerId: string,
  input: CreateNoteInput,
): Promise<CustomerNote> {
  const { data } = await apiClient.post<ApiSuccess<CustomerNote>>(
    `/api/customers/${customerId}/notes`,
    input,
  );
  return data.data;
}
