export function StatTile({ label, value, meta, emphasis }) {
  const shell =
    emphasis === "total"
      ? "border-emerald-900/80 shadow-[inset_0_0_0_1px_rgba(0,208,132,0.18)]"
      : emphasis === "accentEnd"
        ? "border-zinc-800 border-l-2 border-l-rose-500/45"
        : "border-zinc-800";
  return (
    <article className={`rounded-2xl border bg-[#0b1116] p-3.5 ${shell}`}>
      <p className="text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-zinc-400">
        {label}
      </p>
      <p className="my-1.5 text-[1.75rem] font-extrabold tracking-tight text-zinc-50">
        {value}
      </p>
      {meta ? <p className="text-[0.78rem] text-zinc-500">{meta}</p> : null}
    </article>
  );
}
