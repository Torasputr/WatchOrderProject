type ButtonLinkProps = {
  href: string;
  variant: "primary" | "secondary";
  children: React.ReactNode;
};

export function ButtonLink({ href, variant, children }: ButtonLinkProps) {
  const base =
    "inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300";
  const styles =
    variant === "primary"
      ? "bg-[var(--kr-accent-primary)] border-2 border-[var(--kr-accent-primary)] text-[var(--kr-bg-to)] hover:bg-[var(--kr-bg-to)] hover:text-[var(--kr-accent-primary)]"
      : "border border-[var(--kr-border)] text-[var(--kr-text-primary)] hover:border-[var(--kr-text-muted)]";

  return (
    <a href={href} className={`${base} ${styles}`}>
      {children}
    </a>
  );
}
