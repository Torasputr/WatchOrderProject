import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../../shared/config/firebase";

type Era = "showa" | "heisei" | "neo-heisei" | "reiwa";

type FirestoreSeriesDoc = {
  name?: string;
  year?: number;
  synopsis?: string;
  posterurl?: string;
  logourl?: string;
  bgurl?: string;
  driver?: string;
};

type SeriesItem = {
  id: string;
  name: string;
  era: Era;
  year?: number;
  synopsis?: string;
  posterurl?: string;
  logourl?: string;
  bgurl?: string;
  driver?: string;
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
  const [isRosterDragging, setIsRosterDragging] = useState(false);
  const rosterScrollRef = useRef<HTMLDivElement | null>(null);
  const rosterDragMovedRef = useRef(false);
  const rosterPointerIdRef = useRef<number | null>(null);
  const rosterStartXRef = useRef(0);
  const rosterStartScrollLeftRef = useRef(0);
  const rosterWindowDragActiveRef = useRef(false);
  const suppressRosterClickRef = useRef(false);

  const DRAG_THRESHOLD_PX = 8;

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
                bgurl: data.bgurl,
                driver: data.driver,
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

  const endRosterWindowDrag = () => {
    if (!rosterWindowDragActiveRef.current) return;
    rosterWindowDragActiveRef.current = false;
    rosterPointerIdRef.current = null;
    setIsRosterDragging(false);
  };

  const handleRosterPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const node = rosterScrollRef.current;
    if (!node) return;
    if (node.scrollWidth <= node.clientWidth) return;
    if (event.button !== 0) return;
    if (rosterWindowDragActiveRef.current) return;

    rosterWindowDragActiveRef.current = true;
    rosterPointerIdRef.current = event.pointerId;
    rosterDragMovedRef.current = false;
    rosterStartXRef.current = event.clientX;
    rosterStartScrollLeftRef.current = node.scrollLeft;

    const onWindowPointerMove = (e: PointerEvent) => {
      if (rosterPointerIdRef.current !== e.pointerId) return;
      const scrollEl = rosterScrollRef.current;
      if (!scrollEl) return;

      const delta = e.clientX - rosterStartXRef.current;
      if (Math.abs(delta) > DRAG_THRESHOLD_PX) {
        rosterDragMovedRef.current = true;
        setIsRosterDragging(true);
        e.preventDefault();
      }
      if (rosterDragMovedRef.current) {
        scrollEl.scrollLeft = rosterStartScrollLeftRef.current - delta;
      }
    };

    const onWindowPointerUp = (e: PointerEvent) => {
      if (rosterPointerIdRef.current !== e.pointerId) return;
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerUp);

      if (rosterDragMovedRef.current) {
        suppressRosterClickRef.current = true;
      }
      rosterDragMovedRef.current = false;
      endRosterWindowDrag();
    };

    window.addEventListener("pointermove", onWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerUp);
  };

  const handleRosterClickCapture = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!suppressRosterClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressRosterClickRef.current = false;
  };

  const preventNativeDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const moveSelectedBy = (step: number) => {
    if (!items.length) return;

    const currentIndex = selectedId
      ? items.findIndex((item) => item.id === selectedId)
      : 0;
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = Math.min(
      items.length - 1,
      Math.max(0, safeCurrentIndex + step)
    );
    const nextItem = items[nextIndex];
    if (!nextItem) return;

    setSelectedId(nextItem.id);
    onSeriesThemeChange(getThemeIdFromName(nextItem.name));

    const rosterNode = rosterScrollRef.current;
    const targetNode = rosterNode?.querySelector<HTMLButtonElement>(
      `[data-series-id="${nextItem.id}"]`
    );
    targetNode?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const handleRosterKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveSelectedBy(1);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveSelectedBy(-1);
      return;
    }
  };

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
      <div className="relative overflow-hidden rounded-2xl border border-[var(--kr-border)] bg-[var(--kr-bg-to)] shadow-[0_0_26px_var(--kr-glow-primary)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,var(--kr-glow-primary),transparent_45%),radial-gradient(circle_at_80%_70%,var(--kr-glow-secondary),transparent_45%)] opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-black/25" />
        {selected?.bgurl || selected?.posterurl ? (
          <img
            key={selected.id}
            src={selected.bgurl ?? selected.posterurl}
            alt={selected.name}
            className="kr-fade-scale-in absolute inset-0 h-full w-full object-cover object-center opacity-30 transition-all duration-300"
          />
        ) : null}

        <div className="relative p-4 md:p-6">
          <div key={selected?.id} className="kr-fade-up-in mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kr-text-muted)]">
                Kamen Rider Selection
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight md:text-5xl">
                {selected?.name ?? "No Series"}
              </h2>
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[var(--kr-accent-primary)]">
                Era {selected?.era ?? "-"}
              </p>
            </div>

            <div className="rounded-lg border border-[var(--kr-border)] bg-black/35 px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--kr-text-muted)]">
                Now Selecting
              </p>
              <p className="mt-1 text-xl font-bold">{selected?.name ?? "-"}</p>
            </div>
          </div>

          <div className="grid items-end gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative h-[420px] overflow-hidden rounded-xl border border-[var(--kr-border)] bg-[linear-gradient(145deg,var(--kr-panel-from),var(--kr-panel-to))] md:h-[500px]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--kr-glow-primary),transparent_55%)] opacity-70" />
              {selected?.posterurl ? (
                <img
                  key={selected?.id}
                  src={selected.posterurl}
                  alt={selected.name}
                  className="kr-fade-scale-in h-full w-full object-contain object-center p-3 opacity-95 transition-all duration-300"
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,var(--kr-glow-primary),transparent_45%),linear-gradient(145deg,var(--kr-panel-from),var(--kr-panel-to))]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            </div>

            <div key={selected?.id} className="kr-fade-up-in rounded-xl border border-[var(--kr-border)] bg-black/45 p-4 backdrop-blur-sm">
              <p className="text-justify text-sm leading-relaxed text-[var(--kr-text-muted)]">
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

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <MetaTile label="Driver" value={selected?.driver ?? "-"} />
                <MetaTile
                  label="Year"
                  value={selected?.year ? String(selected.year) : "-"}
                  accent
                />
                {selected?.id ? (
                  <Link
                    to={`/series/${encodeURIComponent(selected.name)}`}
                    className="inline-flex w-full items-center justify-center rounded-xl border-2 border-[var(--kr-accent-primary)] bg-[var(--kr-accent-primary)] px-4 py-2.5 text-sm font-bold text-[var(--kr-bg-to)] transition-all duration-300 hover:bg-[var(--kr-bg-to)] hover:text-[var(--kr-accent-primary)] sm:col-span-2"
                  >
                    Detail
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[var(--kr-border)] bg-[color-mix(in_srgb,var(--kr-panel-to)_90%,black)] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-wider text-[var(--kr-text-muted)]">
                SERIES ROSTER
              </h3>
              <p className="text-xs text-[var(--kr-text-muted)]">{items.length} entries</p>
            </div>

            <div
              ref={rosterScrollRef}
              onPointerDown={handleRosterPointerDown}
              onKeyDown={handleRosterKeyDown}
              onClickCapture={handleRosterClickCapture}
              onDragStart={preventNativeDrag}
              tabIndex={0}
              className={`hide-scrollbar flex select-none gap-3 overflow-x-auto pb-1 ${isRosterDragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ touchAction: "pan-y" }}
            >
              {items.map((item) => {
                const active = item.id === selected?.id;
                const cardImage = item.logourl ?? item.posterurl;

                return (
                  <button
                    key={item.id}
                    type="button"
                    data-series-id={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      onSeriesThemeChange(getThemeIdFromName(item.name));
                    }}
                    className={[
                      "group relative w-[180px] shrink-0 overflow-hidden rounded-lg border p-2 text-left transition-all duration-200",
                      active
                        ? "border-[var(--kr-accent-primary)] bg-[color-mix(in_srgb,var(--kr-accent-primary)_8%,transparent)] ring-1 ring-[var(--kr-accent-primary)]/70 shadow-[0_0_14px_var(--kr-glow-primary)]"
                        : "border-[var(--kr-border)] bg-[var(--kr-panel-to)]/70 hover:border-[var(--kr-accent-primary)]/60 hover:shadow-[0_0_0_1px_var(--kr-glow-primary)]",
                    ].join(" ")}
                  >
                    <div className="aspect-[16/9] w-full rounded bg-[linear-gradient(145deg,var(--kr-panel-to),#05070b)]">
                      {cardImage ? (
                        <img
                          src={cardImage}
                          alt={`${item.name} logo`}
                          draggable={false}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,var(--kr-glow-secondary),transparent_50%)]" />
                      )}
                    </div>

                    <p className="mt-2 truncate text-xs font-semibold uppercase tracking-wide text-[var(--kr-text-primary)]">
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