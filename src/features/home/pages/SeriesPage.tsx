import SeriesListSection from "../components/SeriesListSection";

type SeriesPageProps = {
  onSeriesThemeChange: (themeid?: string) => void;
};

export default function SeriesPage({ onSeriesThemeChange }: SeriesPageProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col kr-theme-clash">
      <section className="mx-auto w-full max-w-[1300px] px-4 pt-7 pb-4 text-[var(--kr-text-primary)] md:px-8">
        <p className="inline-flex rounded-md border border-[var(--kr-border)] bg-black/20 px-2 py-1 text-[11px] font-bold tracking-widest text-[var(--kr-accent-primary)]">
          KAMEN RIDER DATABASE TERMINAL
        </p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Series Selection</h1>
        <p className="mt-1 text-sm text-[var(--kr-text-muted)]">
          Pick a rider in roster to instantly switch style profile.
        </p>
      </section>

      <SeriesListSection onSeriesThemeChange={onSeriesThemeChange} />
    </main>
  );
}