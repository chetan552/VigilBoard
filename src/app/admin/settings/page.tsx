import { AdminTopbar } from "@/components/AdminTopbar";
import { prisma } from "@/lib/prisma";
import { Link2, LogIn, CheckCircle2, Monitor } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { DisplayPreferences, type DisplayPrefs } from "./DisplayPreferences";

const DEFAULT_PREFS: DisplayPrefs = {
  accentColor: "#00d4aa",
  theme: "dark",
  tempUnit: "fahrenheit",
  timeFormat: "12h",
  refreshInterval: 60000,
};

async function loadPrefs(): Promise<DisplayPrefs> {
  const row = await prisma.config.findUnique({ where: { key: "display_preferences" } });
  if (!row) return DEFAULT_PREFS;
  try { return { ...DEFAULT_PREFS, ...JSON.parse(row.value) }; } catch { return DEFAULT_PREFS; }
}

async function savePrefs(prefs: DisplayPrefs) {
  "use server";
  await prisma.config.upsert({
    where: { key: "display_preferences" },
    update: { value: JSON.stringify(prefs) },
    create: { key: "display_preferences", value: JSON.stringify(prefs) },
  });
  revalidatePath("/", "layout");
}

export default async function SettingsPage() {
  const [refreshToken, prefs] = await Promise.all([
    prisma.config.findUnique({ where: { key: "google_refresh_token" } }),
    loadPrefs(),
  ]);

  const isConnected = !!refreshToken;

  return (
    <>
      <AdminTopbar title="Settings" />
      <div className="p-10 h-full overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-8 animate-fade-in">

          {/* Integrations */}
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <Link2 size={20} className="text-[var(--accent-teal)]" />
              <h2 className="text-xl font-bold">Integrations</h2>
            </div>

            <div className={`p-5 rounded-2xl border ${isConnected ? "border-emerald-500/20 bg-emerald-500/5" : "border-[var(--border-color)] bg-[var(--surface-hover)]"}`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    Google Account
                    {isConnected && <CheckCircle2 size={16} className="text-emerald-500" />}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {isConnected
                      ? "Connected — grants access to Calendar and Tasks"
                      : "Connect to sync Google Calendar events and Google Tasks lists"}
                  </p>
                </div>
                <Link
                  href="/api/auth/google"
                  className={`btn whitespace-nowrap ${isConnected ? "btn-secondary" : "btn-primary"}`}
                >
                  <LogIn size={16} />
                  {isConnected ? "Re-connect" : "Connect Google"}
                </Link>
              </div>
            </div>
          </div>

          {/* Display Preferences */}
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <Monitor size={20} className="text-[var(--accent-teal)]" />
              <h2 className="text-xl font-bold">Display Preferences</h2>
            </div>
            <DisplayPreferences initial={prefs} saveAction={savePrefs} />
          </div>

        </div>
      </div>
    </>
  );
}
