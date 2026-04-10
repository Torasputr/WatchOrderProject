import { ButtonLink } from "../../../shared/ui/ButtonLink";
import { StatTile } from "./StatTile";

export default function HeroSection() {
  return (
    <section className="min-h-screen grid items-center bg-linear-to-b from-[#0b0f13] to-[#080b0d] text-zinc-50 px-10 py-16">
      <div className="mx-auto max-w-7xl grid grid-cols-[0.85fr_1.15fr] items-center gap-30">
        <div>
          <p className="text-xs font-bold text-emerald-500 tracking-widest">
            KAMEN RIDER ARCHIVE
          </p>
          <h1 className="text-4xl font-bold">Kamen Rider Watch Order</h1>
          <h2 className="mt-4 text-zinc-400 text-sm max-w-md">
            Start from the main series, then expand to the movies, crossovers,
            and specials.
          </h2>
          <div className="mt-10 w-full">
            <ButtonLink href="/" variant="primary" children="Start Watchlist" />
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-zinc-800 p-4 bg-linear-to-b from-[#10171D] to-[#0b1116] shadow-[0_0_24px_rgba(16,185,129,0.18)]">
            <StatTile
              label="Total"
              value={100}
              meta="Series"
              emphasis="total"
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <StatTile label="Showa" value={20} meta="Series" emphasis="" />
              <StatTile label="Heisei" value={22} meta="Series" emphasis="" />
              <StatTile
                label="Neo-Heisei"
                value={31}
                meta="Series"
                emphasis=""
              />
              <StatTile
                label="Reiwa"
                value={12}
                meta="Series"
                emphasis="accentEnd"
              />
            </div>
            <p className="mt-3 px-1 text-[0.76rem] leading-snug text-zinc-500">
              Statistics follows the amount of main Kamen Rider series
              only.{" "}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
