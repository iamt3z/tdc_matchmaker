
/**
 * Scoring configuration.
 *
 * Each weight represents the maximum contribution of a factor
 * to the final 100-point compatibility score.
 */
export const MATCH_WEIGHTS = {
  age: 15,
  height: 10,
  income: 10,
  children: 20,
  relocation: 10,
  profession: 10,
  relationshipGoal: 10,
  languages: 5,
  values: 5,
  pets: 5,
} as const;

export const TOTAL_MATCH_WEIGHT = Object.values(
  MATCH_WEIGHTS,
).reduce((total, weight) => total + weight, 0);

/**
 * Use conservative minimums for missing data.
 * Missing information must not be treated as incompatibility.
 */
export const DEFAULT_MATCH_OPTIONS = {
  limit: 10,
  minimumScore: 0,
} as const;
