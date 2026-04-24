import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../../../shared/config/firebase";

type WatchItemType = "main" | "optional";
type WatchPlacement = "exact" | "between" | "around" | "parallel";
type WatchConfidence = "high" | "medium" | "low";

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
  nextId: string | null;
  episode: string;
  title: string;
  type: WatchItemType;
  note: string;
  optional?: boolean;
  placement: WatchPlacement;
  afterId: string | null;
  beforeId: string | null;
  rangeNote: string;
  confidence: WatchConfidence;
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
const WATCHED_STORAGE_PREFIX = "watchOrder:watched:";
const OPEN_ARCS_STORAGE_PREFIX = "watchOrder:openArcs:";

function getTypeClass(type: WatchItemType) {
  if (type === "main") return "border-[var(--kr-accent-primary)]/40 bg-[color-mix(in_srgb,var(--kr-accent-primary)_14%,transparent)] text-[var(--kr-accent-primary)]";
  return "border-sky-300/40 bg-sky-300/10 text-sky-200";
}

export function WatchOrderBoard({ seriesName }: { seriesName: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<WatchItem[]>([]);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [openArcIds, setOpenArcIds] = useState<Set<string>>(new Set(["intro"]));
  const [hasLoadedOpenArcs, setHasLoadedOpenArcs] = useState(false);
  const [hideSpoilers, setHideSpoilers] = useState(true);
  const [rowMetricsById, setRowMetricsById] = useState<
    Map<string, { top: number; height: number }>
  >(new Map());
  const rowsContainerRef = useRef<HTMLDivElement | null>(null);
  const rowRefMap = useRef(new Map<string, HTMLDivElement>());

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
              arcid?: string;
              arclabel?: string;
              nextid?: string | null;
              nextID?: string | null;
              next_id?: string | null;
              placement?: string;
              afterid?: string | null;
              beforeid?: string | null;
              rangenote?: string;
              confidence?: string;
            };
            const safeType: WatchItemType =
              String(data.type ?? "")
                .trim()
                .toLowerCase() === "optional"
                ? "optional"
                : "main";
            const safePlacement: WatchPlacement =
              data.placement === "between" ||
              data.placement === "around" ||
              data.placement === "parallel" ||
              data.placement === "exact"
                ? data.placement
                : "exact";
            const safeConfidence: WatchConfidence =
              data.confidence === "medium" || data.confidence === "low" || data.confidence === "high"
                ? data.confidence
                : "high";

            return {
              id: docSnap.id,
              arcId: data.arcid ?? data.arcId ?? "misc",
              arcLabel: data.arclabel ?? data.arcLabel,
              order: data.order ?? Number.MAX_SAFE_INTEGER,
              nextId: (() => {
                const candidate =
                  data.nextid ?? data.nextId ?? data.nextID ?? data.next_id ?? null;
                if (typeof candidate !== "string") return null;
                const cleaned = candidate.trim();
                return cleaned.length > 0 ? cleaned : null;
              })(),
              episode: data.episode ?? docSnap.id,
              title: data.title ?? "Untitled entry",
              type: safeType,
              note: data.note ?? "",
              optional: Boolean(data.optional),
              placement: safePlacement,
              afterId:
                typeof (data.afterid ?? data.afterId) === "string"
                  ? String(data.afterid ?? data.afterId)
                  : null,
              beforeId:
                typeof (data.beforeid ?? data.beforeId) === "string"
                  ? String(data.beforeid ?? data.beforeId)
                  : null,
              rangeNote:
                typeof (data.rangenote ?? data.rangeNote) === "string"
                  ? String(data.rangenote ?? data.rangeNote)
                  : "",
              confidence: safeConfidence,
            } satisfies WatchItem;
          });

        const byId = new Map(parsed.map((item) => [item.id, item]));
        const byIdLower = new Map(parsed.map((item) => [item.id.toLowerCase(), item]));
        const byEpisode = new Map(
          parsed.map((item) => [String(item.episode ?? "").trim().toLowerCase(), item])
        );
        const resolveLinkedItem = (rawNext: string | null) => {
          if (!rawNext) return null;
          const token = String(rawNext).trim();
          if (!token) return null;
          return (
            byId.get(token) ??
            byIdLower.get(token.toLowerCase()) ??
            byEpisode.get(token.toLowerCase()) ??
            null
          );
        };
        const fallbackSorted = [...parsed].sort((a, b) => a.order - b.order);
        const inbound = new Set<string>();
        for (const item of parsed) {
          const linked = resolveLinkedItem(item.nextId);
          if (linked) {
            inbound.add(linked.id);
          }
        }

        const ordered: WatchItem[] = [];
        const visited = new Set<string>();
        const headCandidates = fallbackSorted
          .filter((item) => !inbound.has(item.id))
          .map((item) => item.id);
        if (headCandidates.length === 0 && fallbackSorted[0]?.id) {
          headCandidates.push(fallbackSorted[0].id);
        }

        const walkFrom = (startId: string | null) => {
          let cursorId = startId;
          while (cursorId && byId.has(cursorId) && !visited.has(cursorId)) {
            const current = byId.get(cursorId)!;
            ordered.push(current);
            visited.add(cursorId);
            const linked = resolveLinkedItem(current.nextId);
            cursorId = linked?.id ?? null;
          }
        };

        for (const headId of headCandidates) {
          walkFrom(headId);
        }

        for (const item of fallbackSorted) {
          if (!visited.has(item.id)) {
            walkFrom(item.id);
          }
        }

        setAllItems(ordered);
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

  const itemById = useMemo(() => {
    return new Map(visibleItems.map((item) => [item.id, item]));
  }, [visibleItems]);
  const normalizedSeriesKey = useMemo(
    () => seriesName.trim().toLowerCase().replace(/\s+/g, "-"),
    [seriesName]
  );
  const watchedStorageKey = `${WATCHED_STORAGE_PREFIX}${normalizedSeriesKey}`;
  const openArcsStorageKey = `${OPEN_ARCS_STORAGE_PREFIX}${normalizedSeriesKey}`;

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
        items,
      };
    });
  }, [visibleItems]);

  useEffect(() => {
    if (!normalizedSeriesKey) return;
    setHasLoadedOpenArcs(false);
    try {
      const rawWatched = localStorage.getItem(watchedStorageKey);
      if (rawWatched) {
        const parsed = JSON.parse(rawWatched);
        if (Array.isArray(parsed)) {
          setWatchedIds(
            new Set(parsed.filter((value): value is string => typeof value === "string"))
          );
        }
      } else {
        setWatchedIds(new Set());
      }

      const rawOpenArcs = localStorage.getItem(openArcsStorageKey);
      if (rawOpenArcs) {
        const parsed = JSON.parse(rawOpenArcs);
        if (Array.isArray(parsed)) {
          setOpenArcIds(
            new Set(parsed.filter((value): value is string => typeof value === "string"))
          );
        }
      } else {
        setOpenArcIds(new Set());
      }
      setHasLoadedOpenArcs(true);
    } catch {
      setWatchedIds(new Set());
      setOpenArcIds(new Set());
      setHasLoadedOpenArcs(true);
    }
  }, [normalizedSeriesKey, watchedStorageKey, openArcsStorageKey]);

  useEffect(() => {
    if (!normalizedSeriesKey) return;
    localStorage.setItem(watchedStorageKey, JSON.stringify(Array.from(watchedIds)));
  }, [normalizedSeriesKey, watchedIds, watchedStorageKey]);

  useEffect(() => {
    if (!normalizedSeriesKey) return;
    localStorage.setItem(openArcsStorageKey, JSON.stringify(Array.from(openArcIds)));
  }, [normalizedSeriesKey, openArcIds, openArcsStorageKey]);

  useEffect(() => {
    if (itemsByArc.length === 0) {
      setOpenArcIds(new Set());
      return;
    }

    setOpenArcIds((prev) => {
      if (prev.size > 0) return prev;
      if (hasLoadedOpenArcs) return prev;
      return new Set([itemsByArc[0].id]);
    });
  }, [itemsByArc, hasLoadedOpenArcs]);

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

  useEffect(() => {
    if (!rowsContainerRef.current) return;

    const measure = () => {
      if (!rowsContainerRef.current) return;
      const containerRect = rowsContainerRef.current.getBoundingClientRect();
      const nextMap = new Map<string, { top: number; height: number }>();

      rowRefMap.current.forEach((node, id) => {
        const rect = node.getBoundingClientRect();
        nextMap.set(id, {
          top: rect.top - containerRect.top,
          height: rect.height,
        });
      });
      setRowMetricsById(nextMap);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
    };
  }, [itemsByArc, watchedIds, openArcIds, allItems.length]);

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
        <button
          type="button"
          onClick={() => setHideSpoilers((current) => !current)}
          className={`rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
            hideSpoilers
              ? "border-amber-300/45 bg-amber-300/10 text-amber-100"
              : "border-[var(--kr-border)] bg-black/25 text-[var(--kr-text-muted)]"
          }`}
        >
          {hideSpoilers ? "Hide spoilers: on" : "Hide spoilers: off"}
        </button>
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
                  (() => {
                    const ESTIMATED_ROW_HEIGHT_PX = 58;
                    const rows = arc.items.filter(
                      (entry) => entry.placement === "exact" || !entry.afterId
                    );
                    const sideEntries = arc.items.filter(
                      (entry) => entry.placement !== "exact" && Boolean(entry.afterId)
                    );
                    const rowIndexById = new Map(rows.map((row, index) => [row.id, index]));
                    const positionedSideEntries = sideEntries
                      .map((entry) => {
                        const afterIndex = entry.afterId ? rowIndexById.get(entry.afterId) : undefined;
                        const beforeIndex = entry.beforeId ? rowIndexById.get(entry.beforeId) : undefined;
                        const startBase = afterIndex ?? beforeIndex ?? 0;
                        const endBase = beforeIndex ?? afterIndex ?? startBase;
                        return {
                          entry,
                          startRow: Math.min(startBase, endBase),
                          endRow: Math.max(startBase, endBase),
                        };
                      })
                      .sort((a, b) => a.startRow - b.startRow);

                    return (
                      <div className={sideEntries.length > 0 ? "grid gap-2 md:grid-cols-[minmax(0,1fr)_300px]" : ""}>
                        <div ref={rowsContainerRef} className="space-y-2">
                          {rows.map((item) => (
                            <div
                              key={item.id}
                              className="grid items-center gap-2 rounded-lg border border-[var(--kr-border)] bg-black/20 p-2 text-sm md:grid-cols-[auto_1fr_auto_auto]"
                              ref={(node) => {
                                if (node) rowRefMap.current.set(item.id, node);
                                else rowRefMap.current.delete(item.id);
                              }}
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
                                {(() => {
                                  const shouldBlurTitle =
                                    hideSpoilers &&
                                    !watchedIds.has(item.id) &&
                                    /^episode\b/i.test(item.episode.trim());
                                  return (
                                    <p className="font-semibold">
                                      <span>{item.episode} - </span>
                                      <span
                                        className={`transition-[filter] duration-200 ${
                                          shouldBlurTitle ? "blur-[5px] hover:blur-0" : ""
                                        }`}
                                      >
                                        {item.title}
                                      </span>
                                    </p>
                                  );
                                })()}
                                <p className="text-xs text-[var(--kr-text-muted)]">{item.note}</p>
                              </div>

                              <div className="flex items-center gap-1">
                                <span
                                  className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${getTypeClass(item.type)}`}
                                >
                                  {item.type === "optional" ? "OPTIONAL" : "MAIN"}
                                </span>
                              </div>

                              {item.optional ? (
                                <span className="rounded-md border border-[var(--kr-border)] bg-black/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--kr-text-muted)]">
                                  Optional
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>

                        {sideEntries.length > 0 ? (
                          <aside className="space-y-2">
                            {(() => {
                              let lastRowEnd = -1;
                              return positionedSideEntries.map(({ entry: opt, startRow, endRow }) => {
                                const gapRows = Math.max(0, startRow - (lastRowEnd + 1));
                                const rowSpan = Math.max(1, endRow - startRow + 1);
                                lastRowEnd = endRow;
                                const afterMetrics = opt.afterId ? rowMetricsById.get(opt.afterId) : undefined;
                                const beforeMetrics = opt.beforeId ? rowMetricsById.get(opt.beforeId) : undefined;
                                const exactTopPx = afterMetrics?.top ?? startRow * ESTIMATED_ROW_HEIGHT_PX;
                                const exactBottomPx = beforeMetrics
                                  ? beforeMetrics.top + beforeMetrics.height
                                  : afterMetrics
                                    ? afterMetrics.top + afterMetrics.height
                                    : exactTopPx + rowSpan * ESTIMATED_ROW_HEIGHT_PX;
                                const exactHeightPx = Math.max(56, exactBottomPx - exactTopPx);
                                return (
                                  <div
                                    key={opt.id}
                                    className="flex flex-col rounded-xl border border-cyan-300/40 bg-[color-mix(in_srgb,black_78%,#22d3ee_22%)] p-2 text-[10px] text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.22)]"
                                    style={{
                                      marginTop:
                                        afterMetrics || beforeMetrics
                                          ? exactTopPx
                                          : gapRows * ESTIMATED_ROW_HEIGHT_PX,
                                      minHeight:
                                        afterMetrics || beforeMetrics
                                          ? exactHeightPx
                                          : rowSpan * ESTIMATED_ROW_HEIGHT_PX,
                                    }}
                                  >
                                    {(() => {
                                      const shouldBlurTitle =
                                        hideSpoilers &&
                                        !watchedIds.has(opt.id) &&
                                        /^episode\b/i.test(opt.episode.trim());
                                      return (
                                        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-cyan-50">
                                          <span>{opt.episode} - </span>
                                          <span
                                            className={`transition-[filter] duration-200 ${
                                              shouldBlurTitle ? "blur-[5px] hover:blur-0" : ""
                                            }`}
                                          >
                                            {opt.title}
                                          </span>
                                        </p>
                                      );
                                    })()}
                                    <p className="mt-1 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-100/90">
                                      OPTIONAL
                                    </p>
                                    <p className="mt-1 rounded-md border border-cyan-200/35 bg-cyan-200/10 px-1.5 py-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-cyan-100">
                                      Flexible Watch Slot
                                    </p>
                                    <p className="mt-1 text-center text-[10px] text-cyan-100/85">
                                      {opt.afterId && itemById.get(opt.afterId)
                                        ? itemById.get(opt.afterId)!.episode
                                        : "Episode ?"}{" "}
                                      {`\u2192`}{" "}
                                      {opt.beforeId && itemById.get(opt.beforeId)
                                        ? itemById.get(opt.beforeId)!.episode
                                        : "Episode ?"}
                                    </p>
                                    {opt.rangeNote ? (
                                      <p className="mt-1 text-center text-[10px] text-cyan-100/75">
                                        {opt.rangeNote}
                                      </p>
                                    ) : null}
                                    <div className="mt-2 flex flex-1 flex-col items-center justify-center rounded-md border border-cyan-200/20 bg-gradient-to-b from-cyan-300/10 via-transparent to-transparent px-2 py-1">
                                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-200/10 text-cyan-100/85 shadow-[0_0_12px_rgba(34,211,238,0.28)]">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="1.8"
                                          className="h-5 w-5"
                                          aria-hidden="true"
                                        >
                                          <rect x="3" y="5" width="18" height="14" rx="2" />
                                          <path d="M8 5v14" />
                                          <path d="M16 5v14" />
                                          <circle cx="6" cy="8" r="0.8" fill="currentColor" stroke="none" />
                                          <circle cx="6" cy="12" r="0.8" fill="currentColor" stroke="none" />
                                          <circle cx="6" cy="16" r="0.8" fill="currentColor" stroke="none" />
                                          <circle cx="18" cy="8" r="0.8" fill="currentColor" stroke="none" />
                                          <circle cx="18" cy="12" r="0.8" fill="currentColor" stroke="none" />
                                          <circle cx="18" cy="16" r="0.8" fill="currentColor" stroke="none" />
                                        </svg>
                                      </span>
                                      <span className="mt-1 inline-flex rounded-full border border-cyan-200/45 bg-cyan-200/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-50">
                                        Movie
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleWatched(opt.id)}
                                      className={`mt-2 w-full rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors ${
                                        watchedIds.has(opt.id)
                                          ? "border-emerald-300/45 bg-emerald-300/15 text-emerald-100"
                                          : "border-cyan-200/40 bg-cyan-200/10 text-cyan-100 hover:bg-cyan-200/20"
                                      }`}
                                    >
                                      {watchedIds.has(opt.id) ? "Marked Watched" : "Mark as Watched"}
                                    </button>
                                  </div>
                                );
                              });
                            })()}
                          </aside>
                        ) : null}
                      </div>
                    );
                  })()
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
