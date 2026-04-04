import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { WidgetRenderer } from "@/components/widgets/WidgetRenderer";
import { ScreenControls } from "@/components/ScreenControls";
import { AutoRefresh } from "@/components/AutoRefresh";
import { getPrefs } from "@/lib/prefs";

type Props = { params: Promise<{ id: string }> };

export default async function LiveScreen(props: Props) {
  const params = await props.params;
  const [screen, prefs] = await Promise.all([
    prisma.screen.findUnique({ where: { id: params.id }, include: { widgets: true } }),
    getPrefs(),
  ]);

  if (!screen) notFound();

  return (
    <div className="w-screen h-screen bg-[var(--bg-color)] p-6 overflow-hidden">
      <ScreenControls adminHref="/admin" />
      <AutoRefresh intervalMs={prefs.refreshInterval} />
      {screen.widgets.length === 0 ? (
        <div className="flex flex-col h-full items-center justify-center text-center gap-6">
          <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[var(--accent-teal)]/20 to-transparent rounded-full flex items-center justify-center animate-pulse-glow">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-teal)] to-teal-400 rounded-full flex items-center justify-center">
                <span className="text-black text-2xl font-bold">V</span>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Vigilboard Live Screen</h2>
              <p className="text-[var(--text-secondary)] text-lg">No widgets configured for this screen.</p>
            </div>
            <a href={`/admin/screen/${screen.id}`} className="btn btn-primary px-8 py-3 text-lg">
              Open Dashboard Designer
            </a>
          </div>
        </div>
      ) : (
        <div
          className="w-full h-full grid gap-4"
          style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))", gridTemplateRows: "repeat(12, minmax(0, 1fr))" }}
        >
          {screen.widgets.map((widget) => (
            <div
              key={widget.id}
              style={{
                gridColumnStart: widget.x + 1,
                gridColumnEnd: `span ${widget.w}`,
                gridRowStart: widget.y + 1,
                gridRowEnd: `span ${widget.h}`,
              }}
              className="card overflow-clip shadow-xl animate-fade-in hover:transform-none hover:shadow-xl [touch-action:pan-y]"
            >
              <WidgetRenderer widget={widget} prefs={prefs} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
