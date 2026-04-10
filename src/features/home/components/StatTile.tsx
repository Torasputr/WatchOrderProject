export function StatTile({ label, value, meta, emphasis }) {
  const shell =
    emphasis === "total"
      ? "border-[var(--kr-accent-primary)]/80 shadow-[inset_0_0_0_1px_var(--kr-glow-primary)]"
      : emphasis === "accentEnd"
        ? "border-[var(--kr-border)] border-l-2 border-l-[var(--kr-accent-secondary)]/45"
        : "border-[var(--kr-border)]";
  return (
    <article className={`rounded-2xl border bg-[var(--kr-panel-to)] p-3.5 ${shell}`}>
      <p className="text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-[var(--kr-text-muted)]">
        {label}
      </p>
      <p className="my-1.5 text-[1.75rem] font-extrabold tracking-tight text-[var(--kr-text-primary)]">
        {value}
      </p>
      {meta ? <p className="text-[0.78rem] text-[var(--kr-text-muted)]">{meta}</p> : null}
    </article>
  );
}
