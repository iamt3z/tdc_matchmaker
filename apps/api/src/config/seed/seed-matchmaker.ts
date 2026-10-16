import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Matchmaker } from "@tdc/types";
import { matchmakerRepository } from "../../repositories/matchmaker.repository";


/**
 * Seed a local development account.
 *
 * Configure SEED_MATCHMAKER_PASSWORD in apps/api/.env.
 * Never commit real credentials or generated password hashes.
 */
async function seedMatchmaker(): Promise<void> {
  const username = process.env.SEED_MATCHMAKER_USERNAME ?? "admin";
  const password = process.env.SEED_MATCHMAKER_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error(
      "Set SEED_MATCHMAKER_PASSWORD to a password of at least 12 characters.",
    );
  }

  const existing =
    await matchmakerRepository.findByUsername(username);

  if (existing) {
    console.log(`Matchmaker "${username}" already exists; skipping.`);
    return;
  }

  const now = new Date().toISOString();

  const matchmaker: Matchmaker = {
    id: randomUUID(),
    username,
    displayName: "TDC Matchmaker",
    passwordHash: await bcrypt.hash(password, 8),
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  await matchmakerRepository.create(matchmaker);

  console.log(`Seeded development matchmaker "${username}".`);
}

seedMatchmaker().catch((error: unknown) => {
  console.error("Failed to seed matchmaker:", error);
  process.exitCode = 1;
});