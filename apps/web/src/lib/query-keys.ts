import type { CustomerStatus } from "./api/types";

export const queryKeys = {
  customers: {
    all: ["customers"] as const,
    list: (params: {
      search?: string;
      status?: CustomerStatus;
      page?: number;
    }) => ["customers", "list", params] as const,
    detail: (id: string) => ["customers", "detail", id] as const,
  },
  matches: {
    byCustomer: (customerId: string) =>
      ["matches", "customer", customerId] as const,
    detail: (matchId: string) => ["matches", "detail", matchId] as const,
  },
  notes: {
    byCustomer: (customerId: string) =>
      ["notes", "customer", customerId] as const,
  },
};
