import { CheckSquare, Square, BookOpen, Calendar } from "lucide-react";
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

const SUBJECT_COLORS: Record<string, string> = {
  Math:        "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Science:     "text-green-400 bg-green-500/10 border-green-500/20",
  English:     "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  History:     "text-orange-400 bg-orange-500/10 border-orange-500/20",
  Reading:     "text-purple-400 bg-purple-500/10 border-purple-500/20",
  Writing:     "text-pink-400 bg-pink-500/10 border-pink-500/20",
  Art:         "text-rose-400 bg-rose-500/10 border-rose-500/20",
  Music:       "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  PE:          "text-lime-400 bg-lime-500/10 border-lime-500/20",
  Other:       "text-[var(--text-secondary)] bg-[var(--surface-hover)] border-[var(--border-color)]",
};

function subjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] ?? SUBJECT_COLORS["Other"];
}

type DueWithin = "all" | "today" | "this_week" | "this_and_next_week" | "this_month" | "next_30_days";

// Returns the upper bound (inclusive end-of-day) for the given filter, in UTC.
// Lower bound is unbounded — assignments overdue from any point in the past
// still show, since they're not done yet.
function dueUpperBound(filter: DueWithin, now: Date): Date | null {
  if (filter === "all") return null;
  // Use UTC to match ICS dates (stored as UTC midnight).
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const dow = now.getUTCDay(); // 0=Sun..6=Sat
  const endOfDay = (date: Date) => {
    const x = new Date(date);
    x.setUTCHours(23, 59, 59, 999);
    return x;
  };

  switch (filter) {
    case "today":
      return endOfDay(new Date(Date.UTC(y, m, d)));
    case "this_week": {
      // End of Saturday of the current week
      const daysToSat = 6 - dow;
      return endOfDay(new Date(Date.UTC(y, m, d + daysToSat)));
    }
    case "this_and_next_week": {
      const daysToSat = 6 - dow;
      return endOfDay(new Date(Date.UTC(y, m, d + daysToSat + 7)));
    }
    case "this_month":
      // Last day of the current calendar month
      return endOfDay(new Date(Date.UTC(y, m + 1, 0)));
    case "next_30_days":
      return endOfDay(new Date(Date.UTC(y, m, d + 30)));
  }
}

export async function HomeworkWidget({ widget }: { widget: Widget }) {
  const config = typeof widget.config === "string" && widget.config
    ? JSON.parse(widget.config)
    : (widget.config || {});

  const filterAssignee: string = config.filterAssignee || "";
  const showCompleted: boolean = config.showCompleted === true;
  const showHeader: boolean = config.showHeader !== false;
  const dueWithin: DueWithin = config.dueWithin || "all";
  const includeUndated: boolean = config.includeUndated !== false; // default: include manual entries with no date
  const title: string = config.title || (filterAssignee ? `${filterAssignee}'s Homework` : "Homework");

  const upperBound = dueUpperBound(dueWithin, new Date());

  // Build the date filter:
  // - dueWithin=all → no date filter
  // - dueWithin=other → assignments with dueAt <= upperBound, OR undated (if includeUndated)
  let dateClause: object = {};
  if (upperBound) {
    dateClause = includeUndated
      ? { OR: [{ dueAt: { lte: upperBound } }, { dueAt: null }] }
      : { dueAt: { lte: upperBound } };
  }

  const assignments = await prisma.homework.findMany({
    where: {
      ...(filterAssignee ? { assignee: filterAssignee } : {}),
      ...(showCompleted ? {} : { completed: false }),
      ...dateClause,
    },
    orderBy: [{ completed: "asc" }, { dueAt: "asc" }, { dueDate: "asc" }, { subject: "asc" }],
  });

  const totalCount = assignments.length;
  const doneCount = assignments.filter((a) => a.completed).length;
  const pendingCount = totalCount - doneCount;

  async function toggleAssignment(id: string, completed: boolean) {
    "use server";
    await prisma.homework.update({ where: { id }, data: { completed: !completed } });
    revalidatePath("/", "layout");
  }

  return (
    <div className="flex flex-col h-full w-full p-4 animate-fade-in [touch-action:pan-y]">
      {showHeader && (
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="w-8 h-8 glass bg-gradient-to-br from-blue-500/20 to-transparent rounded-xl flex items-center justify-center">
            <BookOpen size={16} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Homework</p>
            <p className="text-sm font-semibold leading-tight truncate">{title}</p>
          </div>
          {pendingCount > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-full shrink-0">
              {pendingCount} due
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 flex-grow min-h-0 overflow-y-auto pr-1 touch-scroll">
        {assignments.map((hw) => {
          const colorClass = subjectColor(hw.subject);
          return (
            <div
              key={hw.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                hw.completed
                  ? "bg-[var(--surface-hover)] border-[var(--border-color)] opacity-50"
                  : "bg-[var(--surface-hover)] border-[var(--border-color)] hover:border-blue-500/40"
              }`}
            >
              <form action={toggleAssignment.bind(null, hw.id, hw.completed)} className="shrink-0 mt-0.5">
                <button
                  type="submit"
                  className={`p-1 -m-1 transition-colors ${hw.completed ? "text-blue-400" : "text-[var(--text-secondary)] hover:text-blue-400"}`}
                  aria-label={hw.completed ? `Mark "${hw.title}" incomplete` : `Mark "${hw.title}" complete`}
                >
                  {hw.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
              </form>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${hw.completed ? "line-through" : ""}`}>
                  {hw.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colorClass}`}>
                    {hw.subject}
                  </span>
                  {!filterAssignee && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">{hw.assignee}</span>
                  )}
                  {hw.dueDate && (
                    <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                      <Calendar size={9} /> {hw.dueDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {assignments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
            <div className="w-12 h-12 glass rounded-full flex items-center justify-center border border-dashed border-[var(--border-color)]">
              <BookOpen size={20} className="text-[var(--text-secondary)]" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {showCompleted ? "No assignments" : "All caught up!"}
            </p>
            <a href="/admin/homework" className="btn btn-secondary text-xs px-4">Add Assignments</a>
          </div>
        )}
      </div>
    </div>
  );
}
