import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/AdminTopbar";
import { revalidatePath } from "next/cache";
import { Plus, Trash2, CheckCircle, Circle, ListTodo } from "lucide-react";
import { GoogleSyncButton } from "./GoogleSyncButton";

type TaskListConfig = {
  name: string;
  googleTaskListId: string | null;
  lastSynced: string | null;
};

type Task = {
  id: string;
  title: string;
  listName: string;
  dueDate: string | null;
  completed: boolean;
};

const DEFAULT_LISTS: TaskListConfig[] = [
  { name: "Erel", googleTaskListId: null, lastSynced: null },
  { name: "Asaph", googleTaskListId: null, lastSynced: null },
  { name: "Eden", googleTaskListId: null, lastSynced: null },
  { name: "Ashira", googleTaskListId: null, lastSynced: null },
];

async function getListConfigs(): Promise<TaskListConfig[]> {
  const row = await prisma.config.findUnique({ where: { key: "task_lists" } });
  if (row) return JSON.parse(row.value);
  // First time — seed defaults
  await prisma.config.create({ data: { key: "task_lists", value: JSON.stringify(DEFAULT_LISTS) } });
  return DEFAULT_LISTS;
}

async function saveListConfigs(lists: TaskListConfig[]) {
  await prisma.config.upsert({
    where: { key: "task_lists" },
    update: { value: JSON.stringify(lists) },
    create: { key: "task_lists", value: JSON.stringify(lists) },
  });
}

// ── Server Actions ────────────────────────────────────────────────────────────

async function addList(formData: FormData) {
  "use server";
  const name = (formData.get("name") as string).trim();
  if (!name) return;
  const lists = await getListConfigs();
  if (lists.find((l) => l.name.toLowerCase() === name.toLowerCase())) return;
  lists.push({ name, googleTaskListId: null, lastSynced: null });
  await saveListConfigs(lists);
  revalidatePath("/admin/tasks");
}

async function deleteList(listName: string) {
  "use server";
  const lists = await getListConfigs();
  await saveListConfigs(lists.filter((l) => l.name !== listName));
  await prisma.task.deleteMany({ where: { listName } });
  revalidatePath("/admin/tasks");
}

async function updateListMapping(listName: string, googleTaskListId: string | null) {
  "use server";
  const lists = await getListConfigs();
  const updated = lists.map((l) => l.name === listName ? { ...l, googleTaskListId } : l);
  await saveListConfigs(updated);
  revalidatePath("/admin/tasks");
}

async function addTask(formData: FormData) {
  "use server";
  const title = formData.get("title") as string;
  const listName = formData.get("listName") as string;
  const dueDate = formData.get("dueDate") as string;
  if (!title || !listName) return;
  await prisma.task.create({ data: { title, listName, dueDate: dueDate || null, completed: false } });
  revalidatePath("/admin/tasks");
}

async function toggleTask(id: string, currentCompleted: boolean) {
  "use server";
  await prisma.task.update({ where: { id }, data: { completed: !currentCompleted } });
  revalidatePath("/admin/tasks");
}

async function deleteTask(id: string) {
  "use server";
  await prisma.task.delete({ where: { id } });
  revalidatePath("/admin/tasks");
}

async function clearCompleted(listName: string) {
  "use server";
  await prisma.task.deleteMany({ where: { listName, completed: true } });
  revalidatePath("/admin/tasks");
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TasksManager() {
  const [lists, tasks] = await Promise.all([
    getListConfigs(),
    prisma.task.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <>
      <AdminTopbar title="Task Management" />
      <div className="p-8 flex flex-col gap-8">

        {/* Add task bar */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-6 shrink-0">
          <form action={addTask} className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Task Title</label>
              <input name="title" required className="input" placeholder="e.g. Clean Room, Homework…" />
            </div>
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Assign To</label>
              <select name="listName" required className="input">
                {lists.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Due Date</label>
              <input name="dueDate" className="input" placeholder="e.g. Mon Apr 7" />
            </div>
            <button type="submit" className="btn btn-primary h-10 px-5 shrink-0">
              <Plus size={18} /> Add Task
            </button>
          </form>
        </div>

        {/* Lists grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {lists.map((list) => {
            const listTasks = tasks.filter((t: Task) => t.listName === list.name);
            const completedCount = listTasks.filter((t: Task) => t.completed).length;
            return (
              <div key={list.name} className="card flex flex-col min-h-[400px]">
                {/* List header */}
                <div className="p-4 border-b border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ListTodo size={16} className="text-[var(--accent-teal)]" />
                      <h3 className="font-bold text-base">{list.name}</h3>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {completedCount}/{listTasks.length}
                      </span>
                    </div>
                    <form action={deleteList.bind(null, list.name)}>
                      <button
                        type="submit"
                        className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete list"
                        aria-label={`Delete ${list.name} list`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>

                  {/* Progress bar */}
                  {listTasks.length > 0 && (
                    <div className="h-1 bg-[var(--surface-hover)] rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--accent-teal)] to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((completedCount / listTasks.length) * 100)}%` }}
                      />
                    </div>
                  )}

                  {/* Google Tasks sync */}
                  <GoogleSyncButton
                    listName={list.name}
                    googleTaskListId={list.googleTaskListId}
                    lastSynced={list.lastSynced}
                    onMappingChange={updateListMapping}
                  />
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                  {listTasks.map((task: Task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border transition-all ${
                        task.completed
                          ? "bg-green-500/5 border-green-500/10"
                          : "bg-[var(--surface-hover)] border-[var(--border-color)] hover:border-[var(--accent-teal)]/40"
                      }`}
                    >
                      <form action={toggleTask.bind(null, task.id, task.completed)} className="shrink-0 mt-0.5">
                        <button
                          type="submit"
                          className={`transition-colors ${task.completed ? "text-green-400" : "text-[var(--text-secondary)] hover:text-green-400"}`}
                        >
                          {task.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                        </button>
                      </form>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${task.completed ? "line-through opacity-50" : ""}`}>
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Due: {task.dueDate}</p>
                        )}
                      </div>
                      <form action={deleteTask.bind(null, task.id)} className="shrink-0">
                        <button
                          type="submit"
                          className="p-1 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </form>
                    </div>
                  ))}

                  {listTasks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-2">
                      <div className="w-10 h-10 rounded-full border border-dashed border-[var(--border-color)] flex items-center justify-center">
                        <Plus size={18} className="text-[var(--text-tertiary)]" />
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">No tasks yet</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {completedCount > 0 && (
                  <div className="px-3 pb-3 shrink-0">
                    <form action={clearCompleted.bind(null, list.name)}>
                      <button type="submit" className="text-xs text-[var(--text-tertiary)] hover:text-red-400 transition-colors w-full text-center py-1">
                        Clear {completedCount} completed
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new list card */}
          <div className="card border-dashed flex flex-col items-center justify-center p-6 min-h-[200px]">
            <ListTodo size={28} className="text-[var(--text-tertiary)] mb-4" />
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-4">New List</p>
            <form action={addList} className="flex flex-col gap-2 w-full max-w-[180px]">
              <input
                name="name"
                required
                className="input text-sm text-center"
                placeholder="List name…"
              />
              <button type="submit" className="btn btn-secondary text-sm">
                <Plus size={15} /> Create
              </button>
            </form>
          </div>
        </div>

      </div>
    </>
  );
}
