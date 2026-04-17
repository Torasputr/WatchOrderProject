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
import { Route, Routes } from "react-router-dom";
import SeriesDetailPage from "../features/home/pages/SeriesDetailPage";
import SeriesPage from "../features/home/pages/SeriesPage";

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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/series"
          element={
            <SeriesPage
              onSeriesThemeChange={(nextThemeId) => {
                if (nextThemeId && nextThemeId in themes) {
                  setThemeId(nextThemeId as ThemeId);
                }
              }}
            />
          }
        />
        <Route path="/series/:seriesName" element={<SeriesDetailPage />} />
      </Routes>
    </div>
  );
}
