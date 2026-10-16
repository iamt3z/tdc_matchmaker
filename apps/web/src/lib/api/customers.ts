import { apiClient } from "./client";
import type {
  ApiSuccess,
  Customer,
  CustomerListResult,
  CustomerStatus,
} from "./types";

export interface ListCustomersParams {
  search?: string;
  city?: string;
  status?: CustomerStatus;
  page?: number;
  limit?: number;
}

export async function listCustomers(
  params: ListCustomersParams = {},
): Promise<CustomerListResult> {
  const { data } = await apiClient.get<ApiSuccess<CustomerListResult>>(
    "/api/customers",
    { params },
  );
  return data.data;
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.get<ApiSuccess<Customer>>(
    `/api/customers/${id}`,
  );
  return data.data;
}
