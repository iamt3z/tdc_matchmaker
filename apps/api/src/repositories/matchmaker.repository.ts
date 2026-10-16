import type { Matchmaker } from "@tdc/types";
import { JsonStore } from "./json-store";

/**
 * Matchmakers are stored independently from customers.
 * Passwords are persisted only as hashes.
 */
const matchmakerStore = new JsonStore<Matchmaker>("matchmakers.json");

export const matchmakerRepository = {
  findAll(): Promise<Matchmaker[]> {
    return matchmakerStore.getAll();
  },

  async findById(id: string): Promise<Matchmaker | undefined> {
    const matchmakers = await matchmakerStore.getAll();
    return matchmakers.find((matchmaker) => matchmaker.id === id);
  },

  async findByUsername(username: string): Promise<Matchmaker | undefined> {
    const normalizedUsername = username.trim().toLowerCase();
    const matchmakers = await matchmakerStore.getAll();

    return matchmakers.find(
      (matchmaker) =>
        matchmaker.username.toLowerCase() === normalizedUsername,
    );
  },

  create(matchmaker: Matchmaker): Promise<Matchmaker> {
    return matchmakerStore.create(matchmaker);
  },

  update(
    id: string,
    updates: Partial<Matchmaker>,
  ): Promise<Matchmaker | undefined> {
    return matchmakerStore.update(id, updates);
  },
};