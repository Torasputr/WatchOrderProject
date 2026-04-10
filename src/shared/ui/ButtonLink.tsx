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
      ? "bg-emerald-500 border-2 text-[#06110C] hover:bg-[#06110c] hover:text-emerald-500"
      : "border border-zinc-800 text-zinc-50 hover:border-zinc-600";

  return (
    <a href={href} className={`${base} ${styles}`}>
      {children}
    </a>
  );
}
