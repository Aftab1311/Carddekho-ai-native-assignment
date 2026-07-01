"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import type {
  BodyType,
  BuyerPreferences,
  Car,
  FuelType,
  Priority,
  Recommendation,
  RecommendationResponse,
  Transmission,
  Usage
} from "@/lib/types";

const defaultPreferences: BuyerPreferences = {
  minBudget: 700000,
  maxBudget: 1500000,
  usage: "family",
  priorities: ["safety", "mileage"],
  bodyTypes: ["suv"],
  fuelTypes: [],
  transmission: "any"
};

const usageOptions: Array<{ label: string; value: Usage }> = [
  { label: "City", value: "city" },
  { label: "Highway", value: "highway" },
  { label: "Family", value: "family" },
  { label: "Performance", value: "performance" }
];

const priorityOptions: Array<{ label: string; value: Priority }> = [
  { label: "Mileage", value: "mileage" },
  { label: "Safety", value: "safety" },
  { label: "Comfort", value: "comfort" },
  { label: "Low maintenance", value: "maintenance" }
];

const bodyTypeOptions: Array<{ label: string; value: BodyType }> = [
  { label: "Hatchback", value: "hatchback" },
  { label: "Sedan", value: "sedan" },
  { label: "SUV", value: "suv" },
  { label: "MUV", value: "muv" }
];

const fuelOptions: Array<{ label: string; value: FuelType }> = [
  { label: "Petrol", value: "petrol" },
  { label: "Diesel", value: "diesel" },
  { label: "CNG", value: "cng" },
  { label: "Electric", value: "electric" },
  { label: "Hybrid", value: "hybrid" }
];

const presets: Array<{ label: string; preferences: BuyerPreferences }> = [
  {
    label: "Safe family",
    preferences: defaultPreferences
  },
  {
    label: "City saver",
    preferences: {
      minBudget: 600000,
      maxBudget: 1100000,
      usage: "city",
      priorities: ["mileage", "maintenance"],
      bodyTypes: ["hatchback", "suv"],
      fuelTypes: ["petrol", "cng", "electric"],
      transmission: "any"
    }
  },
  {
    label: "Highway comfort",
    preferences: {
      minBudget: 1000000,
      maxBudget: 1800000,
      usage: "highway",
      priorities: ["safety", "comfort"],
      bodyTypes: ["sedan", "suv"],
      fuelTypes: ["petrol", "diesel", "hybrid"],
      transmission: "any"
    }
  }
];

export function PreferenceForm() {
  const [preferences, setPreferences] =
    useState<BuyerPreferences>(defaultPreferences);
  const [response, setResponse] = useState<RecommendationResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const recommendations = response?.recommendations || [];
  const activeRecommendation =
    recommendations.find((item) => item.car.id === activeId) || recommendations[0];
  const selectedRecommendations = recommendations.filter((item) =>
    selectedIds.includes(item.car.id)
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const recommendationResponse = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences)
      });

      if (!recommendationResponse.ok) {
        throw new Error("Unable to recommend cars right now.");
      }

      const data = (await recommendationResponse.json()) as RecommendationResponse;
      setResponse(data);
      setActiveId(data.recommendations[0]?.car.id || "");
      setSelectedIds(data.recommendations.slice(0, 3).map((item) => item.car.id));
    } catch {
      setError("Something went wrong while ranking cars. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="app-grid">
      <form className="command-panel" onSubmit={handleSubmit}>
        <div className="panel-heading">
          <p className="section-kicker">Buyer signal</p>
          <h2>Shape the shortlist</h2>
        </div>

        <div className="preset-row">
          {presets.map((preset) => (
            <button
              className="preset-button"
              key={preset.label}
              onClick={() => setPreferences(preset.preferences)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="budget-grid">
          <label>
            Min budget
            <input
              min="0"
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  minBudget: Number(event.target.value)
                }))
              }
              step="50000"
              type="number"
              value={preferences.minBudget}
            />
          </label>

          <label>
            Max budget
            <input
              min="0"
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  maxBudget: Number(event.target.value)
                }))
              }
              step="50000"
              type="number"
              value={preferences.maxBudget}
            />
          </label>
        </div>

        <label>
          Primary use
          <select
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                usage: event.target.value as Usage
              }))
            }
            value={preferences.usage}
          >
            {usageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <PreferenceToggleGroup
          label="Priorities"
          onToggle={(value) =>
            setPreferences((current) => ({
              ...current,
              priorities: toggleValue(current.priorities, value)
            }))
          }
          options={priorityOptions}
          selectedValues={preferences.priorities}
        />

        <PreferenceToggleGroup
          label="Body type"
          onToggle={(value) =>
            setPreferences((current) => ({
              ...current,
              bodyTypes: toggleValue(current.bodyTypes, value)
            }))
          }
          options={bodyTypeOptions}
          selectedValues={preferences.bodyTypes}
        />

        <PreferenceToggleGroup
          label="Fuel"
          onToggle={(value) =>
            setPreferences((current) => ({
              ...current,
              fuelTypes: toggleValue(current.fuelTypes, value)
            }))
          }
          options={fuelOptions}
          selectedValues={preferences.fuelTypes}
        />

        <label>
          Transmission
          <select
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                transmission: event.target.value as Transmission | "any"
              }))
            }
            value={preferences.transmission}
          >
            <option value="any">Any</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>
        </label>

        <button className="primary-button" disabled={isLoading} type="submit">
          {isLoading ? "Ranking cars" : "Generate shortlist"}
        </button>

        {error ? <p className="error-text">{error}</p> : null}
      </form>

      <section className="experience-panel">
        {response && activeRecommendation ? (
          <>
            <Spotlight
              item={activeRecommendation}
              summary={response.summary}
              totalCars={response.totalCarsEvaluated}
            />

            <div className="dashboard-row">
              <ScoreBreakdown item={activeRecommendation} />
              <TradeoffPanel item={activeRecommendation} />
            </div>

            <div className="results-header">
              <div>
                <p className="section-kicker">Ranked shortlist</p>
                <h2>Top 5 recommendations</h2>
              </div>
              <p>{selectedIds.length} cars in comparison</p>
            </div>

            <div className="shortlist-grid">
              {recommendations.map((item, index) => (
                <RecommendationCard
                  compareDisabled={
                    selectedIds.length >= 3 && !selectedIds.includes(item.car.id)
                  }
                  isActive={activeRecommendation.car.id === item.car.id}
                  isSelected={selectedIds.includes(item.car.id)}
                  item={item}
                  key={item.car.id}
                  onActivate={() => setActiveId(item.car.id)}
                  onToggleCompare={() =>
                    setSelectedIds((current) => toggleCompare(current, item.car.id))
                  }
                  rank={index + 1}
                />
              ))}
            </div>

            <ComparisonCharts recommendations={selectedRecommendations} />
          </>
        ) : (
          <EmptyState />
        )}
      </section>
    </section>
  );
}

function PreferenceToggleGroup<T extends string>({
  label,
  options,
  selectedValues,
  onToggle
}: {
  label: string;
  options: Array<{ label: string; value: T }>;
  selectedValues: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="field-group">
      <span>{label}</span>
      <div className="chip-grid">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);

          return (
            <button
              aria-pressed={isSelected}
              className={`chip-button ${isSelected ? "is-active" : ""}`}
              key={option.value}
              onClick={() => onToggle(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Spotlight({
  item,
  summary,
  totalCars
}: {
  item: Recommendation;
  summary: string;
  totalCars: number;
}) {
  return (
    <section className="spotlight">
      <div className="spotlight-copy">
        <div className="verdict-pill">{item.verdict}</div>
        <p className="section-kicker">Top recommendation</p>
        <h2>
          {item.car.make} {item.car.model}
        </h2>
        <p>{summary}</p>

        <div className="ideal-row">
          {item.idealFor.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <div className="hero-vehicle-card">
        <div
          className="hero-gauge"
          style={{ "--score": `${item.matchPercentage}%` } as CSSProperties}
        >
          <strong>{item.matchPercentage}</strong>
          <span>match</span>
        </div>
        <div className="vehicle-visual" aria-hidden="true">
          <span className="vehicle-top" />
          <span className="vehicle-body" />
          <span className="vehicle-wheel one" />
          <span className="vehicle-wheel two" />
        </div>
        <div className="spotlight-stats">
          <Stat label="Cars checked" value={String(totalCars)} />
          <Stat label="Price" value={formatPrice(item.car.price)} />
          <Stat label="Safety" value={`${item.car.safetyRating}/5`} />
        </div>
      </div>
    </section>
  );
}

function ScoreBreakdown({ item }: { item: Recommendation }) {
  const rows = [
    ["Budget fit", item.scoreBreakdown.budget],
    ["Use case", item.scoreBreakdown.useCase],
    ["Preferences", item.scoreBreakdown.preferences],
    ["Priorities", item.scoreBreakdown.priorities],
    ["Ownership", item.scoreBreakdown.ownership]
  ] as const;

  return (
    <section className="insight-panel">
      <div className="panel-heading">
        <p className="section-kicker">Fit analysis</p>
        <h2>Why it ranks high</h2>
      </div>

      <div className="fit-bars">
        {rows.map(([label, value]) => (
          <div className="fit-row" key={label}>
            <div>
              <span>{label}</span>
              <strong>{value}%</strong>
            </div>
            <div className="bar-track">
              <span style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TradeoffPanel({ item }: { item: Recommendation }) {
  return (
    <section className="insight-panel">
      <div className="panel-heading">
        <p className="section-kicker">Decision notes</p>
        <h2>Pros and tradeoffs</h2>
      </div>

      <div className="note-grid">
        <div className="note-card good">
          <span>Pros</span>
          {item.car.pros.map((pro) => (
            <p key={pro}>{pro}</p>
          ))}
        </div>
        <div className="note-card caution">
          <span>Tradeoffs</span>
          {item.tradeoffs.map((tradeoff) => (
            <p key={tradeoff}>{tradeoff}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecommendationCard({
  compareDisabled,
  isActive,
  isSelected,
  item,
  onActivate,
  onToggleCompare,
  rank
}: {
  compareDisabled: boolean;
  isActive: boolean;
  isSelected: boolean;
  item: Recommendation;
  onActivate: () => void;
  onToggleCompare: () => void;
  rank: number;
}) {
  return (
    <article className={`recommendation-card ${isActive ? "is-active" : ""}`}>
      <button className="card-hit-area" onClick={onActivate} type="button">
        <span className="rank-chip">#{rank}</span>
        <span className="mini-gauge">{item.matchPercentage}%</span>

        <span className="card-title">
          <span>{item.car.variant}</span>
          <strong>
            {item.car.make} {item.car.model}
          </strong>
        </span>

        <span className="card-meta">
          {formatPrice(item.car.price)} / {titleCase(item.car.fuelType)} /{" "}
          {formatMileage(item.car)}
        </span>

        <span className="micro-bars">
          <span style={{ width: `${item.scoreBreakdown.budget}%` }} />
          <span style={{ width: `${item.scoreBreakdown.priorities}%` }} />
          <span style={{ width: `${item.scoreBreakdown.ownership}%` }} />
        </span>
      </button>

      <div className="card-bottom-row">
        <span>{item.verdict}</span>
        <button
          aria-pressed={isSelected}
          className={`compare-button ${isSelected ? "is-selected" : ""}`}
          disabled={compareDisabled}
          onClick={onToggleCompare}
          type="button"
        >
          {isSelected ? "In compare" : "Compare"}
        </button>
      </div>
    </article>
  );
}

function ComparisonCharts({
  recommendations
}: {
  recommendations: Recommendation[];
}) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="comparison-zone">
      <div className="results-header">
        <div>
          <p className="section-kicker">Compare</p>
          <h2>Shortlist charts</h2>
        </div>
      </div>

      <div className="chart-grid">
        <CompareMetric
          label="Match score"
          max={100}
          recommendations={recommendations}
          renderValue={(item) => `${item.matchPercentage}%`}
          value={(item) => item.matchPercentage}
        />
        <CompareMetric
          label="Mileage"
          max={getMax(recommendations, (item) => item.car.mileage)}
          recommendations={recommendations}
          renderValue={(item) => formatMileage(item.car)}
          value={(item) => item.car.mileage}
        />
        <CompareMetric
          label="Safety"
          max={5}
          recommendations={recommendations}
          renderValue={(item) => `${item.car.safetyRating}/5`}
          value={(item) => item.car.safetyRating}
        />
        <CompareMetric
          label="User rating"
          max={5}
          recommendations={recommendations}
          renderValue={(item) => `${item.car.userRating}/5`}
          value={(item) => item.car.userRating}
        />
      </div>

      <div className="comparison-cards">
        {recommendations.map((item) => (
          <div className="comparison-card" key={item.car.id}>
            <strong>
              {item.car.make} {item.car.model}
            </strong>
            <span>{item.tradeoffs[0] || "No major tradeoff"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompareMetric({
  label,
  recommendations,
  value,
  max,
  renderValue
}: {
  label: string;
  recommendations: Recommendation[];
  value: (item: Recommendation) => number;
  max: number;
  renderValue: (item: Recommendation) => string;
}) {
  return (
    <div className="chart-card">
      <span>{label}</span>
      <div className="chart-bars">
        {recommendations.map((item) => {
          const percent = max > 0 ? Math.round((value(item) / max) * 100) : 0;

          return (
            <div className="chart-row" key={item.car.id}>
              <div>
                <strong>{item.car.model}</strong>
                <span>{renderValue(item)}</span>
              </div>
              <div className="chart-track">
                <span style={{ width: `${Math.min(100, percent)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="empty-state">
      <div className="empty-signal" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="section-kicker">Recommendation canvas</p>
      <h2>Build the first shortlist.</h2>
      <p>Start with a buyer profile and the engine will map fit, tradeoffs, and comparison signals.</p>
    </section>
  );
}

function toggleValue<T>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];
}

function toggleCompare(values: string[], value: string) {
  if (values.includes(value)) {
    return values.filter((current) => current !== value);
  }

  if (values.length >= 3) {
    return values;
  }

  return [...values, value];
}

function getMax(
  recommendations: Recommendation[],
  value: (item: Recommendation) => number
) {
  return Math.max(...recommendations.map(value), 1);
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(price);
}

function formatMileage(car: Car) {
  if (car.fuelType === "electric") {
    return `${car.mileage} km range`;
  }

  return `${car.mileage} km/l`;
}

function titleCase(value: string) {
  const acronyms = new Set(["suv", "muv", "cng"]);

  if (acronyms.has(value)) {
    return value.toUpperCase();
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
