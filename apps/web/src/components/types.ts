import type { useCustomerMatches } from "@/hooks/use-matches";
import type { useCustomerList } from "@/hooks/use-customers";





/**
 * Derived from the query hook so we stay structurally in sync with the API
 * layer without re-declaring the shapes by hand.
 */
export type MatchListItem = NonNullable<
  ReturnType<typeof useCustomerMatches>["data"]
>[number];

export type Match = MatchListItem["match"];
export type Candidate = MatchListItem["candidate"];

/**
 * Derived from the query hook so we stay structurally in sync with the API
 * layer without re-declaring the shape by hand.
 */
export type CustomerListItem = NonNullable<
  ReturnType<typeof useCustomerList>["data"]
>["items"][number];