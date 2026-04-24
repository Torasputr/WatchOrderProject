import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../../../shared/config/firebase";

type WatchItemType = "main" | "movie" | "special" | "crossover";

type WatchArc = {
  id: string;
  label: string;
  note: string;
};

type WatchItem = {
  id: string;
  arcId: string;
  arcLabel?: string;
  order: number;
  episode: string;
  title: string;
  type: WatchItemType;
  note: string;
  optional?: boolean;
};

const ARC_META: Record<string, Omit<WatchArc, "id">> = {
  intro: { label: "Arc 1 - Opening", note: "Setup dunia dan konflik awal." },
  middle: {
    label: "Arc 2 - Mid Story",
    note: "Power-up, konflik inti, dan turning point.",
  },
  final: { label: "Arc 3 - Endgame", note: "Klimaks, ending, dan penutup timeline." },
};

const ERAS = ["reiwa", "neo-heisei", "heisei", "showa"] as const;

function getTypeClass(type: WatchItemType) {
  if (type === "main") return "border-[var(--kr-accent-primary)]/40 bg-[color-mix(in_srgb,var(--kr-accent-primary)_14%,transparent)] text-[var(--kr-accent-primary)]";
  if (type === "movie") return "border-[var(--kr-accent-secondary)]/40 bg-[color-mix(in_srgb,var(--kr-accent-secondary)_14%,transparent)] text-[var(--kr-accent-secondary)]";
  if (type === "special") return "border-[var(--kr-border)] bg-black/25 text-[var(--kr-text-muted)]";
  return "border-sky-300/40 bg-sky-300/10 text-sky-200";
}

export function WatchOrderBoard({ seriesName }: { seriesName: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<WatchItem[]>([]);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [openArcIds, setOpenArcIds] = useState<Set<string>>(new Set(["intro"]));

  useEffect(() => {
    async function loadWatchOrder() {
      const normalizedName = seriesName.trim();
      if (!normalizedName) {
        setAllItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let foundSeries: { era: (typeof ERAS)[number]; id: string } | null = null;

        for (const era of ERAS) {
          const seriesRef = collection(
            db,
            "tokusatsu",
            "kamenrider",
            "era",
            era,
            "series"
          );
          const seriesQuery = query(
            seriesRef,
            where("name", "==", normalizedName),
            limit(1)
          );
          const seriesSnap = await getDocs(seriesQuery);
          if (!seriesSnap.empty) {
            foundSeries = { era, id: seriesSnap.docs[0].id };
            break;
          }

          // Fallback for case-mismatch data (e.g. "Zeztz" vs "ZEZTZ")
          const looseSeriesSnap = await getDocs(seriesRef);
          const looseMatch = looseSeriesSnap.docs.find(
            (docSnap) =>
              String(docSnap.data().name ?? "").trim().toLowerCase() ===
              normalizedName.toLowerCase()
          );
          if (looseMatch) {
            foundSeries = { era, id: looseMatch.id };
            break;
          }
        }

        if (!foundSeries) {
          setAllItems([]);
          return;
        }

        const watchRef = collection(
          db,
          "tokusatsu",
          "kamenrider",
          "era",
          foundSeries.era,
          "series",
          foundSeries.id,
          "watchorder"
        );
        const watchSnap = await getDocs(watchRef);

        const parsed = watchSnap.docs
          .map((docSnap) => {
            const data = docSnap.data() as Partial<WatchItem> & {
              type?: string;
            };
            const safeType: WatchItemType =
              data.type === "movie" ||
              data.type === "special" ||
              data.type === "crossover" ||
              data.type === "main"
                ? data.type
                : "main";

            return {
              id: docSnap.id,
              arcId: data.arcId ?? "misc",
              arcLabel: data.arcLabel,
              order: data.order ?? Number.MAX_SAFE_INTEGER,
              episode: data.episode ?? docSnap.id,
              title: data.title ?? "Untitled entry",
              type: safeType,
              note: data.note ?? "",
              optional: Boolean(data.optional),
            } satisfies WatchItem;
          })
          .sort((a, b) => a.order - b.order);

        setAllItems(parsed);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load watch order data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWatchOrder();
  }, [seriesName]);

  const visibleItems = useMemo(() => allItems, [allItems]);

  const progress = useMemo(() => {
    if (visibleItems.length === 0) return { watched: 0, total: 0, percent: 0 };
    const watched = visibleItems.filter((item) => watchedIds.has(item.id)).length;
    return {
      watched,
      total: visibleItems.length,
      percent: Math.round((watched / visibleItems.length) * 100),
    };
  }, [visibleItems, watchedIds]);

  const nextItem = useMemo(() => {
    return visibleItems.find((item) => !watchedIds.has(item.id)) ?? null;
  }, [visibleItems, watchedIds]);

  const itemsByArc = useMemo(() => {
    const grouped = new Map<string, WatchItem[]>();
    for (const item of visibleItems) {
      const current = grouped.get(item.arcId) ?? [];
      current.push(item);
      grouped.set(item.arcId, current);
    }

    return Array.from(grouped.entries()).map(([arcId, items]) => {
      const preset = ARC_META[arcId];
      const fallbackLabel = items[0]?.arcLabel ?? `Arc - ${arcId}`;
      return {
        id: arcId,
        label: preset?.label ?? fallbackLabel,
        note: preset?.note ?? "Episode group.",
        items: [...items].sort((a, b) => a.order - b.order),
      };
    });
  }, [visibleItems]);

  useEffect(() => {
    if (itemsByArc.length === 0) {
      setOpenArcIds(new Set());
      return;
    }

    setOpenArcIds((prev) => {
      if (prev.size > 0) return prev;
      return new Set([itemsByArc[0].id]);
    });
  }, [itemsByArc]);

  const toggleWatched = (id: string) => {
    setWatchedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleArc = (id: string) => {
    setOpenArcIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <section className="mx-auto mt-5 w-full max-w-[1200px] rounded-2xl border border-[var(--kr-border)] bg-[color-mix(in_srgb,var(--kr-panel-to)_86%,black)] p-4 text-[var(--kr-text-primary)] md:p-5">
        <p className="text-sm text-[var(--kr-text-muted)]">Loading watch order...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto mt-5 w-full max-w-[1200px] rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 md:p-5">
        <p className="text-sm font-semibold">Failed to load watch order data.</p>
        <p className="mt-1 text-xs opacity-80">{error}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-5 w-full max-w-[1200px] rounded-2xl border border-[var(--kr-border)] bg-[color-mix(in_srgb,var(--kr-panel-to)_86%,black)] p-4 text-[var(--kr-text-primary)] md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kr-accent-primary)]">
            Watch Order Board
          </p>
          <h2 className="mt-1 text-2xl font-black">{seriesName} Timeline</h2>
          <p className="mt-1 text-sm text-[var(--kr-text-muted)]">
            1 episode = 1 row, tapi tetap interaktif dengan progress tracker.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--kr-border)] bg-black/25 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-wider text-[var(--kr-text-muted)]">
            Progress
          </p>
          <p className="text-xl font-black">
            {progress.watched}/{progress.total} ({progress.percent}%)
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <div className="rounded-lg border border-[var(--kr-border)] bg-black/25 p-3">
          <p className="text-[11px] uppercase tracking-wider text-[var(--kr-text-muted)]">
            Next to watch
          </p>
          <p className="mt-1 text-sm font-semibold">
            {nextItem ? `${nextItem.episode} - ${nextItem.title}` : "All done."}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {itemsByArc.length === 0 ? (
          <article className="rounded-xl border border-[var(--kr-border)] bg-black/25 p-4">
            <p className="text-sm text-[var(--kr-text-muted)]">
              Belum ada data watch order untuk series ini.
            </p>
          </article>
        ) : null}
        {itemsByArc.map((arc) => (
          <article
            key={arc.id}
            className="rounded-xl border border-[var(--kr-border)] bg-black/25"
          >
            <button
              type="button"
              onClick={() => toggleArc(arc.id)}
              className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left md:px-4"
            >
              <div>
                <h3 className="text-base font-bold">{arc.label}</h3>
                <p className="text-xs text-[var(--kr-text-muted)]">{arc.note}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--kr-text-muted)]">{arc.items.length} entries</p>
                <p className="text-sm font-semibold">{openArcIds.has(arc.id) ? "Collapse" : "Expand"}</p>
              </div>
            </button>

            {openArcIds.has(arc.id) ? (
              <div className="space-y-2 border-t border-[var(--kr-border)] px-3 pb-3 pt-2 md:px-4">
                {arc.items.length === 0 ? (
                  <p className="py-2 text-sm text-[var(--kr-text-muted)]">
                    Tidak ada entry.
                  </p>
                ) : (
                  arc.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid items-center gap-2 rounded-lg border border-[var(--kr-border)] bg-black/20 p-2 text-sm md:grid-cols-[auto_1fr_auto_auto]"
                    >
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={watchedIds.has(item.id)}
                          onChange={() => toggleWatched(item.id)}
                          className="h-4 w-4 rounded border-[var(--kr-border)] bg-black/30 accent-[var(--kr-accent-primary)]"
                        />
                      </label>

                      <div>
                        <p className="font-semibold">
                          {item.episode} - {item.title}
                        </p>
                        <p className="text-xs text-[var(--kr-text-muted)]">{item.note}</p>
                      </div>

                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${getTypeClass(item.type)}`}
                      >
                        {item.type}
                      </span>

                      {item.optional ? (
                        <span className="rounded-md border border-[var(--kr-border)] bg-black/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--kr-text-muted)]">
                          Optional
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--kr-text-muted)]">Required</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
