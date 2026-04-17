import { useMemo, useState } from "react";

type WatchItemType = "main" | "movie" | "special" | "crossover";
type WatchMode = "main" | "full" | "no-crossover";

type WatchArc = {
  id: string;
  label: string;
  note: string;
};

type WatchItem = {
  id: string;
  arcId: string;
  order: number;
  episode: string;
  title: string;
  type: WatchItemType;
  note: string;
  optional?: boolean;
};

const WATCH_ARCS: WatchArc[] = [
  { id: "intro", label: "Arc 1 - Opening", note: "Setup dunia dan konflik awal." },
  { id: "middle", label: "Arc 2 - Mid Story", note: "Power-up, konflik inti, dan turning point." },
  { id: "final", label: "Arc 3 - Endgame", note: "Klimaks, ending, dan penutup timeline." },
];

const WATCH_ORDER_DUMMY: WatchItem[] = [
  { id: "ep-01", arcId: "intro", order: 1, episode: "EP 01", title: "Wake Up Call", type: "main", note: "Episode pembuka." },
  { id: "ep-02", arcId: "intro", order: 2, episode: "EP 02", title: "First Encounter", type: "main", note: "Kenalan rider & rival." },
  { id: "ep-03", arcId: "intro", order: 3, episode: "EP 03", title: "Rising Threat", type: "main", note: "Ancaman mulai naik." },
  { id: "mv-01", arcId: "intro", order: 4, episode: "MOVIE", title: "Episode Zero", type: "movie", note: "Disarankan setelah EP 03." },
  { id: "ep-04", arcId: "middle", order: 5, episode: "EP 04", title: "Mid Arc Start", type: "main", note: "Masuk arc tengah." },
  { id: "ep-05", arcId: "middle", order: 6, episode: "EP 05", title: "Dual Conflict", type: "main", note: "Front lawan makin luas." },
  { id: "cv-01", arcId: "middle", order: 7, episode: "CROSS", title: "Crossover Stage", type: "crossover", note: "Opsional untuk konteks rider lain.", optional: true },
  { id: "ep-06", arcId: "middle", order: 8, episode: "EP 06", title: "Core Revelation", type: "main", note: "Reveal lore utama." },
  { id: "ep-07", arcId: "final", order: 9, episode: "EP 07", title: "Final Build-Up", type: "main", note: "Persiapan endgame." },
  { id: "ep-08", arcId: "final", order: 10, episode: "EP 08", title: "Final Battle", type: "main", note: "Klimaks pertarungan." },
  { id: "sp-01", arcId: "final", order: 11, episode: "SPECIAL", title: "After Story", type: "special", note: "Epilog setelah ending.", optional: true },
];

function getTypeClass(type: WatchItemType) {
  if (type === "main") return "border-[var(--kr-accent-primary)]/40 bg-[color-mix(in_srgb,var(--kr-accent-primary)_14%,transparent)] text-[var(--kr-accent-primary)]";
  if (type === "movie") return "border-[var(--kr-accent-secondary)]/40 bg-[color-mix(in_srgb,var(--kr-accent-secondary)_14%,transparent)] text-[var(--kr-accent-secondary)]";
  if (type === "special") return "border-[var(--kr-border)] bg-black/25 text-[var(--kr-text-muted)]";
  return "border-sky-300/40 bg-sky-300/10 text-sky-200";
}

export function WatchOrderBoard({ seriesName }: { seriesName: string }) {
  const [mode, setMode] = useState<WatchMode>("main");
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [openArcIds, setOpenArcIds] = useState<Set<string>>(new Set(["intro"]));

  const visibleItems = useMemo(() => {
    return WATCH_ORDER_DUMMY.filter((item) => {
      if (mode === "main") return item.type === "main";
      if (mode === "no-crossover") return item.type !== "crossover";
      return true;
    });
  }, [mode]);

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
    return WATCH_ARCS.map((arc) => ({
      ...arc,
      items: visibleItems
        .filter((item) => item.arcId === arc.id)
        .sort((a, b) => a.order - b.order),
    }));
  }, [visibleItems]);

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
            {nextItem ? `${nextItem.episode} - ${nextItem.title}` : "All done in this mode."}
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-[var(--kr-border)] bg-black/25 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("main")}
            className={`rounded-md px-3 py-1.5 ${mode === "main" ? "bg-[var(--kr-accent-primary)] text-[var(--kr-bg-to)]" : "text-[var(--kr-text-muted)]"}`}
          >
            Main Only
          </button>
          <button
            type="button"
            onClick={() => setMode("full")}
            className={`rounded-md px-3 py-1.5 ${mode === "full" ? "bg-[var(--kr-accent-primary)] text-[var(--kr-bg-to)]" : "text-[var(--kr-text-muted)]"}`}
          >
            Full
          </button>
          <button
            type="button"
            onClick={() => setMode("no-crossover")}
            className={`rounded-md px-3 py-1.5 ${mode === "no-crossover" ? "bg-[var(--kr-accent-primary)] text-[var(--kr-bg-to)]" : "text-[var(--kr-text-muted)]"}`}
          >
            No Crossover
          </button>
        </div>
      </div>

      <div className="space-y-3">
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
                    Tidak ada entry di mode ini.
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
