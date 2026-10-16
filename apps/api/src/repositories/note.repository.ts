
import type { CustomerNote } from "@tdc/types";
import { JsonStore } from "./json-store";

const store = new JsonStore<CustomerNote>("notes.json");

export const noteRepository = {
  findAll: () => store.getAll(),

  findById: (id: string) => store.getById(id),

  async findByCustomerId(customerId: string) {
    const notes = await store.getAll();

    return notes.filter((note) => note.customerId === customerId);
  },

  create: (note: CustomerNote) => store.create(note),

  update: (id: string, updates: Partial<CustomerNote>) =>
    store.update(id, updates),

  delete: (id: string) => store.delete(id),
};
