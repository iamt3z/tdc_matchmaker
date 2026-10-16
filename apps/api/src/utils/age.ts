/**
 * Authoritative age calculation for the matchmaker API.
 *
 * Uses UTC calendar dates so eligibility and scoring agree whether
 * the call comes from the matching engine or the service layer.
 * A birthday on the same UTC calendar day counts as having occurred.
 */
export function calculateAgeUtc(dateOfBirth: string): number {
  // Accept YYYY-MM-DD or full ISO strings; force UTC midnight for date-only values.
  const normalized =
    /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())
      ? `${dateOfBirth.trim()}T00:00:00.000Z`
      : dateOfBirth;

  const birthDate = new Date(normalized);

  if (Number.isNaN(birthDate.getTime())) {
    throw new Error(`Invalid date of birth: ${dateOfBirth}`);
  }

  const today = new Date();

  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();

  const birthdayHasPassed =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() >= birthDate.getUTCDate());

  if (!birthdayHasPassed) {
    age -= 1;
  }

  return age;
}
