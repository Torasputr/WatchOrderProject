import { Link, useParams } from "react-router-dom";
import { WatchOrderBoard } from "../components/WatchOrderBoard";

export default function SeriesDetailPage() {
  const { seriesName } = useParams();
  const decodedName = seriesName ? decodeURIComponent(seriesName) : "";

  return (
    <main className="kr-theme-clash flex min-h-0 flex-1 flex-col px-4 py-8 text-[var(--kr-text-primary)] md:px-10">
      <Link
        to="/series"
        className="text-sm font-semibold text-[var(--kr-accent-primary)] hover:underline"
      >
        ← Back to selection
      </Link>
      <h1 className="mt-4 text-2xl font-black md:text-3xl">Series detail</h1>
      <p className="mt-2 text-sm text-[var(--kr-text-muted)]">
        Stub page for <span className="font-mono text-[var(--kr-text-primary)]">{decodedName || "—"}</span>
        . Replace this with full layout when ready.
      </p>

      <WatchOrderBoard seriesName={decodedName || "Unknown Series"} />
    </main>
  );
}
