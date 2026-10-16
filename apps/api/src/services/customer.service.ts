
import { randomUUID } from "node:crypto";
import type {
  CreateCustomerInput,
  Customer,
  CustomerListItem,
  CustomerStatus,
  UpdateCustomerInput,
} from "@tdc/types";

import { customerRepository } from "../repositories/customer.repository";

interface CustomerListOptions {
  matchmakerId: string;
  search?: string;
  status?: CustomerStatus;
  city?: string;
  page: number;
  limit: number;
}

/**
 * Calculates age using calendar dates rather than approximating
 * a year as 365 days.
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(`${dateOfBirth}T00:00:00.000Z`);

  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();

  const hasHadBirthdayThisYear =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() >= birthDate.getUTCDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

/**
 * Converts a full customer record into the smaller dashboard DTO.
 */
function toListItem(customer: Customer): CustomerListItem {
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    age: calculateAge(customer.dateOfBirth),
    city: customer.location.city,
    maritalStatus: customer.maritalStatus,
    status: customer.status,
    verificationStatus: customer.verification.status,
  };
}

export const customerService = {
  async list(options: CustomerListOptions) {
    const allCustomers = await customerRepository.findAll();

    // Scope the dashboard to the current matchmaker.
    let filtered = allCustomers.filter(
      (customer) => customer.assignedMatchmakerId === options.matchmakerId,
    );

    if (options.search) {
      const query = options.search.trim().toLowerCase();

      filtered = filtered.filter((customer) =>
        [
          customer.firstName,
          customer.lastName,
          customer.email,
          customer.location.city,
        ].some((value) => value.toLowerCase().includes(query)),
      );
    }

    if (options.status) {
      filtered = filtered.filter(
        (customer) => customer.status === options.status,
      );
    }

    if (options.city) {
      filtered = filtered.filter(
        (customer) =>
          customer.location.city.toLowerCase() ===
          options.city!.toLowerCase(),
      );
    }

    const total = filtered.length;
    const start = (options.page - 1) * options.limit;

    return {
      items: filtered
        .slice(start, start + options.limit)
        .map(toListItem),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  },

  async getById(id: string, matchmakerId: string) {
    const customer = await customerRepository.findById(id);

    // Avoid exposing another matchmaker's customer.
    if (!customer || customer.assignedMatchmakerId !== matchmakerId) {
      return undefined;
    }

    return customer;
  },

  async create(
    input: CreateCustomerInput,
    matchmakerId: string,
  ): Promise<Customer> {
    const now = new Date().toISOString();

    const customer: Customer = {
      ...input,
      id: randomUUID(),
      assignedMatchmakerId: matchmakerId,
      status: "NEW",
      verification: { status: "UNVERIFIED" },
      matchIds: [],
      noteIds: [],
      createdAt: now,
      updatedAt: now,
    };

    return customerRepository.create(customer);
  },

  async update(
    id: string,
    input: UpdateCustomerInput,
    matchmakerId: string,
  ): Promise<Customer | undefined> {
    const existing = await this.getById(id, matchmakerId);

    if (!existing) {
      return undefined;
    }

    // Update only the supplied editable fields.
    const updated = await customerRepository.update(id, {
      ...input,
      updatedAt: new Date().toISOString(),
    });

    return updated;
  },
};
