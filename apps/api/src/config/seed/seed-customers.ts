import "dotenv/config";


import { createSeedCustomer } from "./customer-factory";
import { matchmakerRepository } from "../../repositories/matchmaker.repository";
import { customerRepository } from "../../repositories/customer.repository";

const PROFILE_COUNT = 120;

/**
 * Inserts missing seed profiles without deleting existing customers.
 */
async function seedCustomers(): Promise<void> {
  const username = process.env.SEED_MATCHMAKER_USERNAME ?? "admin";

  const matchmaker =
    await matchmakerRepository.findByUsername(username);

  if (!matchmaker) {
    throw new Error(
      `Matchmaker "${username}" does not exist. Run the matchmaker seed first.`,
    );
  }

  let created = 0;
  let skipped = 0;

  for (let index = 0; index < PROFILE_COUNT; index += 1) {
    const customer = createSeedCustomer(index, matchmaker.id);

    // Stable IDs make reruns safe.
    const existing = await customerRepository.findById(customer.id);

    if (existing) {
      skipped += 1;
      continue;
    }

    await customerRepository.create(customer);
    created += 1;
  }

  const allCustomers = await customerRepository.findAll();

  const seededCustomers = allCustomers.filter(
    (customer) => customer.id.startsWith("seed-customer-"),
  );

  const maleCount = seededCustomers.filter(
    (customer) => customer.gender === "MALE",
  ).length;

  const femaleCount = seededCustomers.filter(
    (customer) => customer.gender === "FEMALE",
  ).length;

  console.log("Customer seed completed.");
  console.log(`Created during this run: ${created}`);
  console.log(`Skipped existing records: ${skipped}`);
  console.log(`Seeded profile total: ${seededCustomers.length}`);
  console.log(`Male profiles: ${maleCount}`);
  console.log(`Female profiles: ${femaleCount}`);

  if (seededCustomers.length < PROFILE_COUNT) {
    throw new Error(
      `Expected at least ${PROFILE_COUNT} seed profiles; found ${seededCustomers.length}.`,
    );
  }

  if (maleCount < 50 || femaleCount < 50) {
    throw new Error(
      "The seed dataset does not contain enough profiles of both genders.",
    );
  }
}

seedCustomers().catch((error: unknown) => {
  console.error("Failed to seed customers:", error);
  process.exitCode = 1;
});