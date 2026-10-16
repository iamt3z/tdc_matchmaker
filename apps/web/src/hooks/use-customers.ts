"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomer, listCustomers } from "@/lib/api/customers";
import type { CustomerStatus } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

export function useCustomerList(params: {
  search?: string;
  status?: CustomerStatus;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => listCustomers(params),
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id ?? ""),
    queryFn: () => getCustomer(id!),
    enabled: Boolean(id),
  });
}
