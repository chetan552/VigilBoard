import { prisma } from "./prisma";

export type DisplayPrefs = {
  accentColor: string;
  theme: "dark" | "darker" | "dim";
  tempUnit: "fahrenheit" | "celsius";
  timeFormat: "12h" | "24h";
  refreshInterval: number;
};

const DEFAULTS: DisplayPrefs = {
  accentColor: "#00d4aa",
  theme: "dark",
  tempUnit: "fahrenheit",
  timeFormat: "12h",
  refreshInterval: 60000,
};

export async function getPrefs(): Promise<DisplayPrefs> {
  try {
    const row = await prisma.config.findUnique({ where: { key: "display_preferences" } });
    if (row) return { ...DEFAULTS, ...JSON.parse(row.value) };
  } catch { /* ignore */ }
  return DEFAULTS;
}
