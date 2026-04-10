import { useEffect, useState } from "react";
import HomePage from "../features/home/pages/HomePage";
import { Navbar } from "../shared/ui/Navbar";
import {
  applyTheme,
  DEFAULT_THEME_ID,
  THEME_STORAGE_KEY,
  themes,
  type ThemeId,
} from "../shared/config/theme";

export default function App() {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    return stored && stored in themes ? stored : DEFAULT_THEME_ID;
  });

  useEffect(() => {
    applyTheme(themes[themeId]);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }, [themeId]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar themeId={themeId} onThemeChange={setThemeId} />
      <HomePage />
    </div>
  );
}
