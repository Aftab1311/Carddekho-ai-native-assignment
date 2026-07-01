import { PreferenceForm } from "@/components/preference-form";

export default function HomePage() {
  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">CarDekho AI-native MVP</p>
          <h1>Find the car that actually fits.</h1>
        </div>
        <p>
          A recommendation cockpit for budget, usage, priorities, tradeoffs,
          and comparison signals.
        </p>
      </header>

      <PreferenceForm />
    </main>
  );
}
