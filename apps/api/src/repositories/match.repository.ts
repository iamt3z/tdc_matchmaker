
import type { Match } from "@tdc/types";
import { JsonStore } from "./json-store";

const store = new JsonStore<Match>("matches.json");

export const matchRepository = {
  findAll: () => store.getAll(),

  findById: (id: string) => store.getById(id),

  async findByCustomerId(customerId: string) {
    const matches = await store.getAll();

    return matches.filter(
      (match) =>
        match.customerId === customerId ||
        match.candidateCustomerId === customerId,
    );
  },

  create: (match: Match) => store.create(match),

  update: (id: string, updates: Partial<Match>) =>
    store.update(id, updates),
};
