import { CheckSquare, Square, Plus, Calendar } from "lucide-react";
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

type Task = {
  id: string;
  title: string;
  listName: string;
  dueDate: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function TasksWidget({ widget }: { widget: Widget }) {
  const config = typeof widget.config === 'string' && widget.config
    ? JSON.parse(widget.config)
    : (widget.config || {});

  const listName = config.listName || "";
  const title = config.title || listName;
  const showHeader: boolean = config.showHeader !== false;
  const showProgress: boolean = config.showProgress !== false;

  const tasks = await prisma.task.findMany({
    where: { listName },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  async function toggleTask(taskId: string, completed: boolean) {
    "use server";
    await prisma.task.update({
      where: { id: taskId },
      data: { completed: !completed },
    });
    revalidatePath("/", "layout");
  }

  return (
    <div className="flex flex-col h-full w-full p-4 animate-fade-in">
      {showHeader && (
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-8 h-8 glass bg-gradient-to-br from-green-500/20 to-transparent rounded-xl flex items-center justify-center">
            <CheckSquare size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Tasks</p>
            <p className="text-sm font-semibold leading-tight">{title}</p>
          </div>
        </div>
      )}

      {showProgress && totalCount > 0 && (
        <div className="mb-3 shrink-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-[var(--text-secondary)]">Progress</span>
            <span className="text-xs font-semibold">{pct}%</span>
          </div>
          <div className="h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[var(--text-tertiary)]">{completedCount} done</span>
            <span className="text-xs text-[var(--text-tertiary)]">{totalCount - completedCount} left</span>
          </div>
        </div>
      )}

      <div className="flex-grow min-h-0 overflow-hidden">
        <div className="flex flex-col gap-2 h-full overflow-y-auto pr-1" style={{ touchAction: 'pan-y' }}>
          {tasks.map((task: Task) => (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-[var(--surface-hover)] border-[var(--border-color)] hover:border-green-500/40'
              }`}
            >
              <form action={toggleTask.bind(null, task.id, task.completed)} className="shrink-0 mt-0.5">
                <button
                  type="submit"
                  className={`p-1 -m-1 transition-colors ${task.completed ? 'text-green-400' : 'text-[var(--text-secondary)] hover:text-green-400'}`}
                  title={task.completed ? "Mark incomplete" : "Mark complete"}
                  aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
                >
                  {task.completed ? <CheckSquare size={24} /> : <Square size={24} />}
                </button>
              </form>
              <div className="flex-grow min-w-0">
                <p className={`text-sm font-medium leading-snug ${task.completed ? 'opacity-50 line-through' : ''}`}>
                  {task.title}
                </p>
                {task.dueDate && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar size={11} className="text-[var(--text-tertiary)]" />
                    <span className="text-xs text-[var(--text-tertiary)]">{task.dueDate}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
              <div className="w-12 h-12 glass rounded-full flex items-center justify-center border border-dashed border-[var(--border-color)]">
                <Plus size={20} className="text-[var(--text-secondary)]" />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">No tasks for {listName}</p>
              <a href="/admin/tasks" className="btn btn-secondary text-xs px-4">Add Tasks</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
