const createTheme = (
  accentPrimary: string,
  accentSecondary: string,
  overrides?: Partial<{
    bgFrom: string;
    bgTo: string;
    panelFrom: string;
    panelTo: string;
    textPrimary: string;
    textMuted: string;
    border: string;
    glowPrimary: string;
    glowSecondary: string;
  }>,
) => ({
  bgFrom: "#0b0f13",
  bgTo: "#080b0d",
  panelFrom: "#10171d",
  panelTo: "#0b1116",
  textPrimary: "#f4f7fa",
  textMuted: "#a1a1aa",
  border: "#27272a",
  accentPrimary,
  accentSecondary,
  glowPrimary: "rgba(255,255,255,0.22)",
  glowSecondary: "rgba(255,255,255,0.20)",
  ...overrides,
});

export const themes = {
  // Reiwa+
  myth: createTheme("#3dd5ff", "#d8f94b", {
    bgFrom: "#070d16",
    bgTo: "#04080f",
    panelFrom: "#0c1a2a",
    panelTo: "#09131f",
    textPrimary: "#eaf6ff",
    textMuted: "#9bb0c5",
    border: "#1f334a",
    glowPrimary: "rgba(61, 213, 255, 0.26)",
    glowSecondary: "rgba(216, 249, 75, 0.20)",
  }),
  zeztz: createTheme("#10b981", "#f43f5e", {
    glowPrimary: "rgba(16, 185, 129, 0.22)",
    glowSecondary: "rgba(244, 63, 94, 0.20)",
  }),
  gavv: createTheme("#d946ef", "#f59e0b", {
    bgFrom: "#120b10",
    bgTo: "#0a070b",
    panelFrom: "#1a1018",
    panelTo: "#120b12",
    textPrimary: "#f7f3ff",
    textMuted: "#b8a8c9",
    border: "#3a2a3f",
    glowPrimary: "rgba(217, 70, 239, 0.24)",
    glowSecondary: "rgba(245, 158, 11, 0.22)",
  }),
  gotchard: createTheme("#00b4ff", "#ff9500", {
    bgFrom: "#0a1018",
    bgTo: "#06090e",
    panelFrom: "#0f1a26",
    panelTo: "#0a121a",
    textPrimary: "#f0f8ff",
    textMuted: "#8fb0c4",
    border: "#1e3d52",
    glowPrimary: "rgba(0, 180, 255, 0.28)",
    glowSecondary: "rgba(255, 149, 0, 0.26)",
  }),
  geats: createTheme("#e6002e", "#ff7a18", {
    bgFrom: "#0c0808",
    bgTo: "#060505",
    panelFrom: "#1a1012",
    panelTo: "#120a0c",
    textPrimary: "#faf7f7",
    textMuted: "#b0a0a2",
    border: "#3d2528",
    glowPrimary: "rgba(230, 0, 46, 0.28)",
    glowSecondary: "rgba(255, 122, 24, 0.24)",
  }),
  revice: createTheme("#ff5ab8", "#2ecfff", {
    bgFrom: "#110a16",
    bgTo: "#07050c",
    panelFrom: "#1a0f22",
    panelTo: "#120a18",
    textPrimary: "#fff5fc",
    textMuted: "#b9a0c5",
    border: "#4a2f5c",
    glowPrimary: "rgba(255, 90, 184, 0.26)",
    glowSecondary: "rgba(46, 207, 255, 0.24)",
  }),
  saber: createTheme("#e60012", "#ffe100", {
    bgFrom: "#0c0606",
    bgTo: "#050304",
    panelFrom: "#1a0c0c",
    panelTo: "#120808",
    textPrimary: "#fff9f5",
    textMuted: "#c4a8a0",
    border: "#5c2020",
    glowPrimary: "rgba(230, 0, 18, 0.28)",
    glowSecondary: "rgba(255, 225, 0, 0.22)",
  }),
  zeroOne: createTheme("#deff00", "#ff2020", {
    bgFrom: "#050505",
    bgTo: "#000000",
    panelFrom: "#0f0f0f",
    panelTo: "#080808",
    textPrimary: "#f7fff0",
    textMuted: "#9ca396",
    border: "#2a2e24",
    glowPrimary: "rgba(222, 255, 0, 0.26)",
    glowSecondary: "rgba(255, 32, 32, 0.22)",
  }),

  // Neo-Heisei
  ziO: createTheme("#ff2d8b", "#b8bcc6", {
    bgFrom: "#070708",
    bgTo: "#030304",
    panelFrom: "#121214",
    panelTo: "#0c0c0e",
    textPrimary: "#f4f4f8",
    textMuted: "#9b9ba8",
    border: "#3a3a42",
    glowPrimary: "rgba(255, 45, 139, 0.26)",
    glowSecondary: "rgba(184, 188, 198, 0.18)",
  }),
  build: createTheme("#e02030", "#006fe6", {
    bgFrom: "#06080c",
    bgTo: "#030408",
    panelFrom: "#0e1218",
    panelTo: "#080b10",
    textPrimary: "#f2f5fa",
    textMuted: "#94a0b0",
    border: "#284060",
    glowPrimary: "rgba(224, 32, 48, 0.26)",
    glowSecondary: "rgba(0, 111, 230, 0.24)",
  }),
  exAid: createTheme("#ec4899", "#22c55e"),
  ghost: createTheme("#f97316", "#facc15"),
  drive: createTheme("#dc2626", "#9ca3af"),
  gaim: createTheme("#f97316", "#1d4ed8"),
  wizard: createTheme("#b91c1c", "#0f172a"),
  fourze: createTheme("#fb923c", "#facc15"),
  ooo: createTheme("#f59e0b", "#dc2626"),
  double: createTheme("#047857", "#111827"),

  // Heisei (Phase 1)
  decade: createTheme("#ec4899", "#6b7280"),
  kiva: createTheme("#7f1d1d", "#f59e0b"),
  denO: createTheme("#ef4444", "#3b82f6"),
  kabuto: createTheme("#b91c1c", "#9ca3af"),
  hibiki: createTheme("#7c2d12", "#6b7280"),
  blade: createTheme("#2563eb", "#facc15"),
  faiz: createTheme("#dc2626", "#9ca3af"),
  ryuki: createTheme("#dc2626", "#6b7280"),
  agito: createTheme("#f59e0b", "#111827"),
  kuuga: createTheme("#991b1b", "#f59e0b"),

  // Showa (project rule includes Shin / ZO / J)
  j: createTheme("#16a34a", "#f59e0b"),
  zo: createTheme("#22c55e", "#f59e0b"),
  shin: createTheme("#22c55e", "#6b7280"),
  blackRx: createTheme("#16a34a", "#111827"),
  black: createTheme("#111827", "#dc2626"),
  super1: createTheme("#dc2626", "#facc15"),
  skyrider: createTheme("#16a34a", "#facc15"),
  stronger: createTheme("#facc15", "#111827"),
  amazon: createTheme("#22c55e", "#f97316"),
  x: createTheme("#2563eb", "#dc2626"),
  v3: createTheme("#16a34a", "#dc2626"),
  ichigo: createTheme("#16a34a", "#dc2626"),
} as const;

export type ThemeId = keyof typeof themes;
export type AppTheme = (typeof themes)[ThemeId];

export const DEFAULT_THEME_ID: ThemeId = "zeztz";
export const THEME_STORAGE_KEY = "kr-theme";

export function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.style.setProperty("--kr-bg-from", theme.bgFrom);
  root.style.setProperty("--kr-bg-to", theme.bgTo);
  root.style.setProperty("--kr-panel-from", theme.panelFrom);
  root.style.setProperty("--kr-panel-to", theme.panelTo);
  root.style.setProperty("--kr-text-primary", theme.textPrimary);
  root.style.setProperty("--kr-text-muted", theme.textMuted);
  root.style.setProperty("--kr-border", theme.border);
  root.style.setProperty("--kr-accent-primary", theme.accentPrimary);
  root.style.setProperty("--kr-accent-secondary", theme.accentSecondary);
  root.style.setProperty("--kr-glow-primary", theme.glowPrimary);
  root.style.setProperty("--kr-glow-secondary", theme.glowSecondary);
}
