import { themes, type ThemeId } from "../config/theme";

type NavbarProps = {
  themeId: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
};

const themeIds = Object.keys(themes) as ThemeId[];

function formatThemeLabel(id: ThemeId) {
  return id
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

export function Navbar({ themeId, onThemeChange }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--kr-border)] bg-[color-mix(in_srgb,var(--kr-panel-to)_82%,transparent)] backdrop-blur-md">
      <nav
        className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3"
        aria-label="Main"
      >
        <a
          href="#hero"
          className="shrink-0 text-sm font-bold tracking-tight text-[var(--kr-text-primary)] transition-colors hover:text-[var(--kr-accent-primary)]"
        >
          TokuWatchOrder
        </a>

        <div className="min-w-0 flex-1" aria-hidden="true" />

        <div className="flex shrink-0 items-center gap-2">
          <label
            htmlFor="rider-theme"
            className="sr-only"
          >
            Rider theme
          </label>
          <select
            id="rider-theme"
            value={themeId}
            onChange={(event) => onThemeChange(event.target.value as ThemeId)}
            className="max-w-[min(12rem,45vw)] rounded-lg border border-[var(--kr-border)] bg-[var(--kr-panel-to)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--kr-text-primary)] outline-none focus:border-[var(--kr-accent-primary)]"
          >
            {themeIds.map((id) => (
              <option key={id} value={id}>
                {formatThemeLabel(id)}
              </option>
            ))}
          </select>
        </div>
      </nav>
    </header>
  );
}
