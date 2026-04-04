import type { Metadata } from "next";
import "./globals.css";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Vigilboard",
  description: "Family dashboard",
};

const DEFAULT_PREFS = {
  accentColor: "#00d4aa",
  theme: "dark" as const,
  tempUnit: "fahrenheit",
  timeFormat: "12h",
  refreshInterval: 60000,
};

const THEME_VARS: Record<string, string[]> = {
  dark:   ["#0a0a0a", "#151515", "#202020", "#2a2a2a"],
  darker: ["#000000", "#0d0d0d", "#161616", "#222222"],
  dim:    ["#111827", "#1f2937", "#283548", "#374151"],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let prefs = DEFAULT_PREFS;
  try {
    const row = await prisma.config.findUnique({ where: { key: "display_preferences" } });
    if (row) prefs = { ...DEFAULT_PREFS, ...JSON.parse(row.value) };
  } catch { /* db may not be ready on first boot */ }

  const theme = THEME_VARS[prefs.theme] ?? THEME_VARS.dark;
  const hex = prefs.accentColor;

  const cssVars = `
    :root {
      --accent-teal: ${hex};
      --accent-teal-glow: ${hex}26;
      --bg-color: ${theme[0]};
      --surface-color: ${theme[1]};
      --surface-hover: ${theme[2]};
      --border-color: ${theme[3]};
    }
  `;

  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400,300&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body style={{ fontFamily: "'Satoshi', sans-serif" }} className="min-h-screen flex flex-col bg-[var(--bg-color)] text-[var(--text-primary)] antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
