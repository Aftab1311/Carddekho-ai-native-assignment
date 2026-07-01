export type Usage = "city" | "highway" | "family" | "performance";
export type Priority = "mileage" | "safety" | "comfort" | "maintenance";
export type BodyType = "hatchback" | "sedan" | "suv" | "muv";
export type FuelType = "petrol" | "diesel" | "cng" | "electric" | "hybrid";
export type Transmission = "manual" | "automatic";

export type Car = {
  id: string;
  make: string;
  model: string;
  variant: string;
  price: number;
  bodyType: BodyType;
  fuelType: FuelType;
  mileage: number;
  safetyRating: number;
  transmission: Transmission;
  seatingCapacity: number;
  userRating: number;
  reviewSummary: string;
  pros: string[];
  cons: string[];
};

export type BuyerPreferences = {
  minBudget: number;
  maxBudget: number;
  usage: Usage;
  priorities: Priority[];
  bodyTypes: BodyType[];
  fuelTypes: FuelType[];
  transmission: Transmission | "any";
};

export type Recommendation = {
  car: Car;
  score: number;
  matchPercentage: number;
  reasons: string[];
  tradeoffs: string[];
  explanation: string;
  verdict: string;
  idealFor: string[];
  scoreBreakdown: {
    budget: number;
    useCase: number;
    preferences: number;
    priorities: number;
    ownership: number;
  };
};

export type RecommendationResponse = {
  summary: string;
  recommendations: Recommendation[];
  totalCarsEvaluated: number;
};
