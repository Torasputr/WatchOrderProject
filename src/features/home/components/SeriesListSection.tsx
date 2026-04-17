import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../../shared/config/firebase";

type Era = "showa" | "heisei" | "neo-heisei" | "reiwa";

type FirestoreSeriesDoc = {
  name?: string;
  year?: number;
  synopsis?: string;
  posterurl?: string;
  logourl?: string;
  rider?: string;
  driver?: string;
  motif?: string;
};

type SeriesItem = {
  id: string;
  name: string;
  era: Era;
  year?: number;
  synopsis?: string;
  posterurl?: string;
  logourl?: string;
  rider?: string;
  driver?: string;
  motif?: string;
};

const ERAS: Era[] = ["showa", "heisei", "neo-heisei", "reiwa"];

type SeriesListSectionProps = {
  onSeriesThemeChange: (themeid?: string) => void;
};

function getThemeIdFromName(name: string) {
  const normalized = name.trim().toLowerCase();

  if (
    normalized === "zero one" ||
    normalized === "zero-one" ||
    normalized === "zeroone"
  ) {
    return "zeroOne";
  }

  return normalized;
}

export default function SeriesListSection({
  onSeriesThemeChange,
}: SeriesListSectionProps) {
  const [items, setItems] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  useEffect(() => {
    async function loadAllSeries() {
      try {
        setLoading(true);
        setError(null);

        const snapshots = await Promise.all(
          ERAS.map(async (era) => {
            const ref = collection(
              db,
              "tokusatsu",
              "kamenrider",
              "era",
              era,
              "series"
            );

            const snap = await getDocs(query(ref, orderBy("name", "asc")));

            return snap.docs.map((d) => {
              const data = d.data() as FirestoreSeriesDoc;
              return {
                id: `${era}__${d.id}`,
                name: data.name ?? d.id,
                era,
                year: data.year,
                synopsis: data.synopsis,
                posterurl: data.posterurl,
                logourl: data.logourl,
                rider: data.rider,
                driver: data.driver,
                motif: data.motif,
              } satisfies SeriesItem;
            });
          })
        );

        const merged = snapshots.flat().sort((a, b) => {
          const yearA = a.year ?? 0;
          const yearB = b.year ?? 0;
          if (yearB !== yearA) return yearB - yearA; // newest first
          return a.name.localeCompare(b.name); // tie-breaker
        });
        setItems(merged);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load Firestore data.");
      } finally {
        setLoading(false);
      }
    }

    loadAllSeries();
  }, []);

  useEffect(() => {
    if (!items.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !items.some((x) => x.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  useEffect(() => {
    setIsSynopsisExpanded(false);
  }, [selectedId]);

  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) ?? null,
    [items, selectedId]
  );
  const synopsis = selected?.synopsis?.trim() ?? "";
  const synopsisNeedsTruncate = synopsis.length > 260;
  const visibleSynopsis =
    isSynopsisExpanded || !synopsisNeedsTruncate
      ? synopsis
      : `${synopsis.slice(0, 260).trimEnd()}...`;

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[1300px] px-4 pb-8 md:px-8">
        <div className="rounded-2xl border border-[var(--kr-border)] bg-[var(--kr-panel-to)] p-4 text-sm text-[var(--kr-text-muted)]">
          Loading selection screen...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-[1300px] px-4 pb-8 md:px-8">
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1300px] px-4 pb-10 md:px-8 text-[var(--kr-text-primary)]">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--kr-border)] bg-[var(--kr-bg-to)] p-3 shadow-[0_0_26px_var(--kr-glow-primary)] md:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,var(--kr-glow-primary),transparent_40%),radial-gradient(circle_at_80%_70%,var(--kr-glow-secondary),transparent_40%)] opacity-40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,var(--kr-accent-primary),transparent)] opacity-80" />

        <div className="relative grid items-start gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          {/* LEFT: big poster */}
          <div className="relative h-[460px] max-h-[78vh] overflow-hidden rounded-xl border border-[var(--kr-border)] bg-[linear-gradient(145deg,var(--kr-panel-from),var(--kr-panel-to))] shadow-[0_0_24px_var(--kr-glow-secondary)] md:h-[540px] lg:h-[620px]">
            <div className="pointer-events-none absolute left-1/2 top-[42%] h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--kr-glow-primary)_0%,transparent_70%)] opacity-75" />
            {selected?.posterurl ? (
              <img
                key={selected?.id}
                src={selected.posterurl}
                alt={selected.name}
                className="h-full w-full object-contain object-center p-3 opacity-95 transition-all duration-300"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,var(--kr-glow-primary),transparent_45%),linear-gradient(145deg,var(--kr-panel-from),var(--kr-panel-to))]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            <div className="absolute left-4 top-4 rounded-md border border-[var(--kr-border)] bg-black/35 px-2 py-1 text-[10px] font-bold tracking-wider">
              TOKUWATCH SELECT
            </div>

            <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/25 p-3 backdrop-blur-[1px]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--kr-text-muted)]">
                {selected?.era ?? "-"}
              </p>
              <h2 className="text-3xl font-extrabold md:text-4xl">
                {selected?.name ?? "No Series"}
              </h2>
              <p className="text-justify mt-2 max-w-2xl text-sm leading-relaxed text-[var(--kr-text-muted)]">
                {visibleSynopsis || "Select a series to display details."}
              </p>
              {synopsisNeedsTruncate ? (
                <button
                  type="button"
                  onClick={() => setIsSynopsisExpanded((current) => !current)}
                  className="mt-2 text-xs font-semibold tracking-wide text-[var(--kr-accent-primary)] hover:underline"
                >
                  {isSynopsisExpanded ? "Show less" : "Read more"}
                </button>
              ) : null}
            </div>
          </div>

          {/* RIGHT: roster cards with logo */}
          <div className="rounded-xl border border-[var(--kr-border)] bg-[linear-gradient(145deg,var(--kr-panel-from),var(--kr-panel-to))] p-4 shadow-[inset_0_0_0_1px_var(--kr-glow-secondary)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-wider text-[var(--kr-text-muted)]">
                SERIES ROSTER
              </h3>
              <p className="text-xs text-[var(--kr-text-muted)]">{items.length} entries</p>
            </div>

            <div className="hide-scrollbar grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto pr-2 pb-1 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const active = item.id === selected?.id;
                const cardImage = item.logourl ?? item.posterurl;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      onSeriesThemeChange(getThemeIdFromName(item.name));
                    }}
                    className={[
                      "group relative overflow-hidden rounded-lg border p-1.5 text-left transition-all duration-200",
                      active
                        ? "border-[var(--kr-accent-primary)] bg-[color-mix(in_srgb,var(--kr-accent-primary)_8%,transparent)] ring-1 ring-[var(--kr-accent-primary)]/70 shadow-[0_0_14px_var(--kr-glow-primary)]"
                        : "border-[var(--kr-border)] hover:-translate-y-0.5 hover:border-[var(--kr-accent-primary)]/60",
                    ].join(" ")}
                  >
                    <div className="aspect-[16/9] w-full rounded bg-[linear-gradient(145deg,var(--kr-panel-to),#05070b)]">
                      {cardImage ? (
                        <img
                          src={cardImage}
                          alt={`${item.name} logo`}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,var(--kr-glow-secondary),transparent_50%)]" />
                      )}
                    </div>

                    <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--kr-text-primary)]">
                      {item.name}
                    </p>

                    {active ? (
                      <span className="absolute right-1 top-1 rounded bg-[var(--kr-accent-primary)] px-1 text-[9px] font-bold text-[var(--kr-bg-to)]">
                        NOW SELECTING
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative mt-4 grid gap-2 rounded-xl border border-[var(--kr-border)] bg-[var(--kr-panel-to)] p-3 shadow-[inset_0_0_0_1px_var(--kr-glow-primary)] md:grid-cols-4">
          <MetaTile label="Main Rider" value={selected?.rider ?? "-"} />
          <MetaTile label="Driver" value={selected?.driver ?? "-"} />
          <MetaTile label="Motif" value={selected?.motif ?? "-"} />
          <MetaTile label="Year" value={selected?.year ? String(selected.year) : "-"} accent />
        </div>
      </div>
    </section>
  );
}

function MetaTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-md border px-3 py-2.5",
        accent
          ? "border-[var(--kr-accent-secondary)] bg-[color-mix(in_srgb,var(--kr-accent-secondary)_10%,transparent)]"
          : "border-[var(--kr-border)]",
      ].join(" ")}
    >
      <p className="text-[10px] uppercase tracking-wider text-[var(--kr-text-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-base font-extrabold tracking-wide">{value}</p>
    </div>
  );
}