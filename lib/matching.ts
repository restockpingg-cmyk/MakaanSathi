type BuyerInput = {
  preferred_localities: string[];
  bhk_requirement: string[];
  budget_min: number;
  budget_max: number;
  furnishing_preference: string | null;
};

type PropertyInput = {
  locality: string;
  bhk: string;
  price: number;
  furnishing: string;
  status: string;
};

export type MatchBreakdown = {
  locality: number;
  bhk: number;
  price: number;
  furnishing: number;
};

export type MatchResult<B, P> = {
  buyer: B;
  property: P;
  score: number;
  breakdown: MatchBreakdown;
};

export function matchScore(
  buyer: BuyerInput,
  property: PropertyInput
): { score: number; breakdown: MatchBreakdown } {
  let locality = 0;
  let bhk = 0;
  let price = 0;
  let furnishing = 0;

  // Locality: 40 pts
  const localityMatch = buyer.preferred_localities.some(
    (loc) => loc.toLowerCase().trim() === property.locality.toLowerCase().trim()
  );
  if (localityMatch) locality = 40;

  // BHK: 25 pts
  if (buyer.bhk_requirement.includes(property.bhk)) bhk = 25;

  // Price within budget: 25 pts
  if (property.price >= buyer.budget_min && property.price <= buyer.budget_max) {
    price = 25;
  } else if (property.price < buyer.budget_min) {
    price = 15; // under budget — still a good lead
  } else {
    const overPct = (property.price - buyer.budget_max) / buyer.budget_max;
    if (overPct <= 0.1) price = 10;
  }

  // Furnishing: 10 pts
  if (!buyer.furnishing_preference || buyer.furnishing_preference === property.furnishing) {
    furnishing = 10;
  }

  return { score: locality + bhk + price + furnishing, breakdown: { locality, bhk, price, furnishing } };
}

export const MIN_MATCH_SCORE = 30;

export function getTopMatches<
  B extends BuyerInput & { id: string },
  P extends PropertyInput & { id: string }
>(buyers: B[], properties: P[], limit = 10): MatchResult<B, P>[] {
  const results: MatchResult<B, P>[] = [];
  const availableProps = properties.filter((p) => p.status === 'AVAILABLE');

  for (const buyer of buyers) {
    for (const property of availableProps) {
      const { score, breakdown } = matchScore(buyer, property);
      if (score >= MIN_MATCH_SCORE) results.push({ buyer, property, score, breakdown });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export type BuyerWithMatches<B, P> = {
  buyer: B;
  matches: MatchResult<B, P>[];
  topScore: number;
};

export function getMatchesByBuyer<
  B extends BuyerInput & { id: string },
  P extends PropertyInput & { id: string }
>(buyers: B[], properties: P[], minScore = MIN_MATCH_SCORE, maxBuyers = 8): BuyerWithMatches<B, P>[] {
  const availableProps = properties.filter((p) => p.status === 'AVAILABLE');
  const result: BuyerWithMatches<B, P>[] = [];

  for (const buyer of buyers) {
    const matches: MatchResult<B, P>[] = [];
    for (const property of availableProps) {
      const { score, breakdown } = matchScore(buyer, property);
      if (score >= minScore) matches.push({ buyer, property, score, breakdown });
    }
    if (matches.length > 0) {
      matches.sort((a, b) => b.score - a.score);
      result.push({ buyer, matches, topScore: matches[0].score });
    }
  }

  return result.sort((a, b) => b.topScore - a.topScore).slice(0, maxBuyers);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}
