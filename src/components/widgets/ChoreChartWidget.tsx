import { CheckSquare, Square, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export async function ChoreChartWidget({ widget }: { widget: Widget }) {
  const config = typeof widget.config === "string" && widget.config
    ? JSON.parse(widget.config)
    : (widget.config || {});

  const filterAssignee: string = config.filterAssignee || "";
  const groupBy: "assignee" | "day" = config.groupBy || "assignee";
  const title: string = config.title || "Chores";
  const showHeader: boolean = config.showHeader !== false;
  const todayDay = DAY_NAMES[new Date().getDay()];
  const today = todayStr();

  // Fetch chores for today (daily + today's weekday)
  const chores = await prisma.chore.findMany({
    where: {
      ...(filterAssignee ? { assignee: filterAssignee } : {}),
      dayOfWeek: { in: ["daily", todayDay] },
    },
    orderBy: [{ assignee: "asc" }, { title: "asc" }],
  });

  const completedCount = chores.filter((c) => c.completedOn === today).length;
  const totalCount = chores.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  async function toggleChore(choreId: string, currentlyDone: boolean) {
    "use server";
    await prisma.chore.update({
      where: { id: choreId },
      data: { completedOn: currentlyDone ? null : todayStr() },
    });
    revalidatePath("/", "layout");
  }

  // Group chores
  const grouped: Record<string, typeof chores> = {};
  if (groupBy === "assignee") {
    for (const chore of chores) {
      if (!grouped[chore.assignee]) grouped[chore.assignee] = [];
      grouped[chore.assignee].push(chore);
    }
  } else {
    for (const chore of chores) {
      const key = chore.dayOfWeek === "daily" ? "Daily" : todayDay;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(chore);
    }
  }

  return (
    <div className="flex flex-col h-full w-full p-4 animate-fade-in [touch-action:pan-y]">
      {showHeader && (
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="w-8 h-8 glass bg-gradient-to-br from-purple-500/20 to-transparent rounded-xl flex items-center justify-center">
            <ClipboardList size={16} className="text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Chores</p>
            <p className="text-sm font-semibold leading-tight truncate">{title}</p>
          </div>
          <span className="text-xs text-[var(--text-tertiary)] shrink-0">{todayDay}</span>
        </div>
      )}

      {totalCount > 0 && (
        <div className="mb-3 shrink-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-[var(--text-secondary)]">Today&apos;s progress</span>
            <span className="text-xs font-semibold">{pct}%</span>
          </div>
          <div className="h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[var(--text-tertiary)]">{completedCount} done</span>
            <span className="text-xs text-[var(--text-tertiary)]">{totalCount - completedCount} left</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 flex-grow min-h-0 overflow-y-auto pr-1 touch-scroll">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1.5 px-1">{group}</p>
            <div className="flex flex-col gap-1.5">
              {items.map((chore) => {
                const done = chore.completedOn === today;
                return (
                  <div
                    key={chore.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      done
                        ? "bg-purple-500/5 border-purple-500/20"
                        : "bg-[var(--surface-hover)] border-[var(--border-color)] hover:border-purple-500/40"
                    }`}
                  >
                    <form action={toggleChore.bind(null, chore.id, done)} className="shrink-0">
                      <button
                        type="submit"
                        className={`p-1 -m-1 transition-colors ${done ? "text-purple-400" : "text-[var(--text-secondary)] hover:text-purple-400"}`}
                        aria-label={done ? `Mark "${chore.title}" incomplete` : `Mark "${chore.title}" complete`}
                      >
                        {done ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </form>
                    <p className={`text-sm font-medium leading-snug flex-1 min-w-0 ${done ? "opacity-50 line-through" : ""}`}>
                      {chore.title}
                    </p>
                    {groupBy === "assignee" && chore.dayOfWeek !== "daily" && (
                      <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">{chore.dayOfWeek}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {chores.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
            <div className="w-12 h-12 glass rounded-full flex items-center justify-center border border-dashed border-[var(--border-color)]">
              <ClipboardList size={20} className="text-[var(--text-secondary)]" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">No chores for today</p>
            <a href="/admin/chores" className="btn btn-secondary text-xs px-4">Manage Chores</a>
          </div>
        )}
      </div>
    </div>
  );
}
