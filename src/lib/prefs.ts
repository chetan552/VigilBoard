import { prisma } from "./prisma";

export type DisplayPrefs = {
  accentColor: string;
  theme: "dark" | "darker" | "dim";
  tempUnit: "fahrenheit" | "celsius";
  timeFormat: "12h" | "24h";
  refreshInterval: number;
  nightDimEnabled: boolean;
  nightDimStart: number;   // hour 0-23, e.g. 21 = 9pm
  nightDimEnd: number;     // hour 0-23, e.g. 6 = 6am
  nightDimLevel: number;   // 0-1, fraction of darkening (0.6 = 60% dim)
  nightDimWarmth: number;  // 0-1, warmth tint strength (0 = none, 1 = strong)
};

const DEFAULTS: DisplayPrefs = {
  accentColor: "#00d4aa",
  theme: "dark",
  tempUnit: "fahrenheit",
  timeFormat: "12h",
  refreshInterval: 60000,
  nightDimEnabled: true,
  nightDimStart: 21,
  nightDimEnd: 6,
  nightDimLevel: 0.6,
  nightDimWarmth: 0.25,
};

export async function getPrefs(): Promise<DisplayPrefs> {
  try {
    const row = await prisma.config.findUnique({ where: { key: "display_preferences" } });
    if (row) return { ...DEFAULTS, ...JSON.parse(row.value) };
  } catch { /* ignore */ }
  return DEFAULTS;
}
