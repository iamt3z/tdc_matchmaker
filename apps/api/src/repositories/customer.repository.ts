
import type { Customer } from "@tdc/types";
import { JsonStore } from "./json-store";

const store = new JsonStore<Customer>("customers.json");

export const customerRepository = {
  findAll: () => store.getAll(),

  findById: (id: string) => store.getById(id),

  create: (customer: Customer) => store.create(customer),

  update: (id: string, updates: Partial<Customer>) =>
    store.update(id, updates),

  delete: (id: string) => store.delete(id),
};
