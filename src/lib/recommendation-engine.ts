import type {
  BodyType,
  BuyerPreferences,
  Car,
  FuelType,
  Priority,
  Recommendation,
  Usage
} from "@/lib/types";

const usages: Usage[] = ["city", "highway", "family", "performance"];
const priorities: Priority[] = ["mileage", "safety", "comfort", "maintenance"];
const bodyTypes: BodyType[] = ["hatchback", "sedan", "suv", "muv"];
const fuelTypes: FuelType[] = ["petrol", "diesel", "cng", "electric", "hybrid"];

export function getRecommendations(
  cars: Car[],
  preferences: BuyerPreferences
): Recommendation[] {
  const cleanPreferences = normalizePreferences(preferences);

  return cars
    .map((car) => scoreCar(car, cleanPreferences))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function buildRecommendationSummary(
  preferences: BuyerPreferences,
  recommendations: Recommendation[]
) {
  if (recommendations.length === 0) {
    return "No strong matches found. Widen the budget or remove a filter to see more options.";
  }

  const top = recommendations[0];
  const budget = `${formatPrice(preferences.minBudget)}-${formatPrice(
    preferences.maxBudget
  )}`;
  const priorityText =
    preferences.priorities.length > 0
      ? preferences.priorities.join(" and ")
      : "balanced ownership";

  return `${top.car.make} ${top.car.model} is the strongest match for a ${preferences.usage} buyer in the ${budget} range, mainly because it scores well on ${priorityText}.`;
}

export function normalizePreferences(
  preferences: Partial<BuyerPreferences>
): BuyerPreferences {
  const minBudget = Number(preferences.minBudget || 0);
  const maxBudget = Number(preferences.maxBudget || 2500000);

  return {
    minBudget: Math.max(0, Math.min(minBudget, maxBudget)),
    maxBudget: Math.max(minBudget, maxBudget),
    usage: usages.includes(preferences.usage as Usage)
      ? (preferences.usage as Usage)
      : "family",
    priorities: filterKnownValues(preferences.priorities, priorities),
    bodyTypes: filterKnownValues(preferences.bodyTypes, bodyTypes),
    fuelTypes: filterKnownValues(preferences.fuelTypes, fuelTypes),
    transmission:
      preferences.transmission === "manual" ||
      preferences.transmission === "automatic"
        ? preferences.transmission
        : "any"
  };
}

function scoreCar(car: Car, preferences: BuyerPreferences): Recommendation {
  const reasons: string[] = [];
  const budgetScore = scoreBudget(car, preferences, reasons);
  const useCaseScore = scoreUsage(car, preferences.usage, reasons);
  const preferenceScore = scoreFilters(car, preferences, reasons);
  const priorityScore = scorePriorities(car, preferences.priorities, reasons);
  const ownershipScore = Math.round(car.userRating * 1.6);
  const score =
    budgetScore + useCaseScore + preferenceScore + priorityScore + ownershipScore;

  const matchPercentage = Math.min(100, Math.round(score));

  return {
    car,
    score: Math.round(score),
    matchPercentage,
    reasons: reasons.slice(0, 4),
    tradeoffs: car.cons,
    explanation: buildCarExplanation(car, reasons),
    verdict: buildVerdict(car, preferences),
    idealFor: buildIdealFor(car, preferences),
    scoreBreakdown: {
      budget: toPercent(budgetScore, 25),
      useCase: toPercent(useCaseScore, 16),
      preferences: toPercent(preferenceScore, 24),
      priorities: toPercent(priorityScore, 24),
      ownership: toPercent(ownershipScore, 8)
    }
  };
}

function scoreBudget(
  car: Car,
  preferences: BuyerPreferences,
  reasons: string[]
) {
  if (car.price >= preferences.minBudget && car.price <= preferences.maxBudget) {
    reasons.push("Fits your budget");
    return 25;
  }

  const nearestBudgetEdge =
    car.price < preferences.minBudget ? preferences.minBudget : preferences.maxBudget;
  const gap = Math.abs(car.price - nearestBudgetEdge);
  const tolerance = nearestBudgetEdge * 0.12;

  if (gap <= tolerance) {
    reasons.push("Sits close to your budget");
    return 10;
  }

  return 0;
}

function scoreUsage(car: Car, usage: Usage, reasons: string[]) {
  if (usage === "city") {
    if (car.mileage >= 19 || car.fuelType === "electric") {
      reasons.push("Efficient for daily city running");
      return 15;
    }

    if (car.bodyType === "hatchback" || car.transmission === "automatic") {
      reasons.push("Easy to use in traffic");
      return 10;
    }
  }

  if (usage === "highway") {
    if (car.safetyRating >= 4 && (car.bodyType === "sedan" || car.bodyType === "suv")) {
      reasons.push("Stable and reassuring for highway trips");
      return 16;
    }

    if (car.safetyRating >= 4) {
      reasons.push("Good safety score for longer drives");
      return 11;
    }
  }

  if (usage === "family") {
    if (car.seatingCapacity >= 7) {
      reasons.push("Extra seats make it practical for family use");
      return 16;
    }

    if (car.safetyRating >= 4 && car.seatingCapacity >= 5) {
      reasons.push("Practical and safety-focused for family use");
      return 15;
    }
  }

  if (usage === "performance" && car.userRating >= 4.4) {
    reasons.push("Feels more engaging than most options here");
    return 13;
  }

  return 7;
}

function scoreFilters(
  car: Car,
  preferences: BuyerPreferences,
  reasons: string[]
) {
  let score = 0;

  if (preferences.bodyTypes.includes(car.bodyType)) {
    score += 10;
    reasons.push(`Matches your ${car.bodyType} preference`);
  }

  if (preferences.fuelTypes.includes(car.fuelType)) {
    score += 8;
    reasons.push(`Matches your ${car.fuelType} preference`);
  }

  if (preferences.transmission === car.transmission) {
    score += 6;
  }

  return score;
}

function scorePriorities(car: Car, selectedPriorities: Priority[], reasons: string[]) {
  const activePriorities =
    selectedPriorities.length > 0 ? selectedPriorities : ["safety", "mileage"];

  const total = activePriorities.reduce((sum, priority) => {
    if (priority === "mileage") {
      const efficiencyScore =
        car.fuelType === "electric" ? 24 : Math.min(24, Math.round(car.mileage));
      if (efficiencyScore >= 18) {
        reasons.push("Keeps running costs under control");
      }
      return sum + efficiencyScore;
    }

    if (priority === "safety") {
      if (car.safetyRating >= 4) {
        reasons.push("Has a strong safety rating");
      }
      return sum + car.safetyRating * 4.8;
    }

    if (priority === "comfort") {
      const comfortScore =
        car.bodyType === "sedan" || car.bodyType === "suv" || car.bodyType === "muv"
          ? 24
          : 18;
      if (comfortScore >= 24) {
        reasons.push("Should feel comfortable on longer drives");
      }
      return sum + comfortScore;
    }

    if (priority === "maintenance") {
      const maintenanceScore =
        car.make === "Maruti Suzuki" || car.make === "Hyundai" || car.make === "Honda"
          ? 24
          : 16;
      if (maintenanceScore >= 24) {
        reasons.push("Has a reputation for easier ownership");
      }
      return sum + maintenanceScore;
    }

    return sum;
  }, 0);

  return Math.round(total / activePriorities.length);
}

function filterKnownValues<T extends string>(
  values: T[] | undefined,
  knownValues: T[]
) {
  return Array.isArray(values)
    ? values.filter((value): value is T => knownValues.includes(value))
    : [];
}

function formatPrice(price: number) {
  if (price >= 100000) {
    return `${(price / 100000).toFixed(price % 100000 === 0 ? 0 : 1)}L`;
  }

  return `${price}`;
}

function buildCarExplanation(car: Car, reasons: string[]) {
  const topReasons = reasons.slice(0, 2).map(reasonToPhrase);

  if (topReasons.length === 0) {
    return car.reviewSummary;
  }

  return `${car.reviewSummary} It ranks highly because it ${topReasons.join(
    " and "
  )}.`;
}

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function reasonToPhrase(reason: string) {
  const phrase = lowerFirst(reason);

  if (phrase.startsWith("practical")) {
    return `is ${phrase}`;
  }

  if (phrase.startsWith("extra seats")) {
    return `offers ${phrase}`;
  }

  if (phrase.startsWith("stable")) {
    return `feels ${phrase}`;
  }

  return phrase;
}

function buildVerdict(car: Car, preferences: BuyerPreferences) {
  if (car.safetyRating >= 5 && preferences.priorities.includes("safety")) {
    return "Best confidence pick";
  }

  if (car.mileage >= 22 || car.fuelType === "electric" || car.fuelType === "hybrid") {
    return "Best running-cost pick";
  }

  if (car.seatingCapacity >= 7) {
    return "Best family-space pick";
  }

  if (car.userRating >= 4.5) {
    return "Best crowd-favorite pick";
  }

  return "Balanced shortlist pick";
}

function buildIdealFor(car: Car, preferences: BuyerPreferences) {
  const tags: string[] = [preferences.usage];

  if (car.safetyRating >= 4) {
    tags.push("safety-first");
  }

  if (car.mileage >= 20 || car.fuelType === "electric" || car.fuelType === "hybrid") {
    tags.push("low running cost");
  }

  if (car.seatingCapacity >= 7) {
    tags.push("larger family");
  }

  if (car.make === "Maruti Suzuki" || car.make === "Hyundai" || car.make === "Honda") {
    tags.push("easy ownership");
  }

  return tags.slice(0, 3);
}

function toPercent(score: number, max: number) {
  return Math.min(100, Math.round((score / max) * 100));
}
