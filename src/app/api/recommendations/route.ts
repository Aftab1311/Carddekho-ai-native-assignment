import { cars } from "@/data/cars";
import {
  buildRecommendationSummary,
  getRecommendations,
  normalizePreferences
} from "@/lib/recommendation-engine";
import type { BuyerPreferences } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<BuyerPreferences>;
    const preferences = normalizePreferences(body);
    const recommendations = getRecommendations(cars, preferences);
    const summary = buildRecommendationSummary(preferences, recommendations);

    return Response.json({
      summary,
      recommendations,
      totalCarsEvaluated: cars.length
    });
  } catch {
    return Response.json(
      { error: "Invalid recommendation request" },
      { status: 400 }
    );
  }
}
