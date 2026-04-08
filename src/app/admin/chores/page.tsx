import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/AdminTopbar";
import { revalidatePath } from "next/cache";
import { Plus, Trash2, ClipboardList } from "lucide-react";

const DAY_OPTIONS = ["daily", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABEL: Record<string, string> = {
  daily: "Every Day",
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

async function addChore(formData: FormData) {
  "use server";
  const title = (formData.get("title") as string).trim();
  const assignee = (formData.get("assignee") as string).trim();
  const dayOfWeek = (formData.get("dayOfWeek") as string) || "daily";
  if (!title || !assignee) return;
  await prisma.chore.create({ data: { title, assignee, dayOfWeek } });
  revalidatePath("/admin/chores");
}

async function deleteChore(id: string) {
  "use server";
  await prisma.chore.delete({ where: { id } });
  revalidatePath("/admin/chores");
}

export default async function ChoresManager() {
  const chores = await prisma.chore.findMany({
    orderBy: [{ assignee: "asc" }, { dayOfWeek: "asc" }, { title: "asc" }],
  });

  // Group by assignee
  const grouped: Record<string, typeof chores> = {};
  for (const chore of chores) {
    if (!grouped[chore.assignee]) grouped[chore.assignee] = [];
    grouped[chore.assignee].push(chore);
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <>
      <AdminTopbar title="Chore Chart" />
      <div className="p-8 flex flex-col gap-8">

        {/* Add chore form */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-6 shrink-0">
          <form action={addChore} className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Chore</label>
              <input name="title" required className="input" placeholder="e.g. Set the table, Vacuum…" />
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Assigned To</label>
              <input name="assignee" required className="input" placeholder="Family member" />
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Day</label>
              <select name="dayOfWeek" className="input">
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>{DAY_LABEL[d]}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary h-10 px-5 shrink-0">
              <Plus size={18} /> Add Chore
            </button>
          </form>
        </div>

        {/* Chores by assignee */}
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 glass rounded-full flex items-center justify-center border border-dashed border-[var(--border-color)]">
              <ClipboardList size={28} className="text-[var(--text-tertiary)]" />
            </div>
            <p className="text-[var(--text-secondary)]">No chores yet. Add one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(grouped).map(([assignee, items]) => {
              const doneToday = items.filter((c) => c.completedOn === todayStr).length;
              return (
                <div key={assignee} className="card flex flex-col">
                  <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 glass bg-gradient-to-br from-purple-500/20 to-transparent rounded-xl flex items-center justify-center">
                        <ClipboardList size={14} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="font-bold text-base">{assignee}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{doneToday}/{items.length} done today</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-4">
                    {items.map((chore) => {
                      const done = chore.completedOn === todayStr;
                      return (
                        <div
                          key={chore.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                            done
                              ? "bg-purple-500/5 border-purple-500/20"
                              : "bg-[var(--surface-hover)] border-[var(--border-color)]"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${done ? "line-through opacity-50" : ""}`}>
                              {chore.title}
                            </p>
                            <p className="text-[10px] text-[var(--text-tertiary)]">{DAY_LABEL[chore.dayOfWeek]}</p>
                          </div>
                          <form action={deleteChore.bind(null, chore.id)}>
                            <button
                              type="submit"
                              className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              aria-label={`Delete "${chore.title}"`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </form>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
