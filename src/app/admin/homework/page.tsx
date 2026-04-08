import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/AdminTopbar";
import { revalidatePath } from "next/cache";
import { Plus, Trash2, BookOpen, CheckCircle, Circle } from "lucide-react";

const SUBJECTS = ["Math", "Science", "English", "History", "Reading", "Writing", "Art", "Music", "PE", "Other"];

const SUBJECT_COLORS: Record<string, string> = {
  Math:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Science: "text-green-400 bg-green-500/10 border-green-500/20",
  English: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  History: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  Reading: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  Writing: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  Art:     "text-rose-400 bg-rose-500/10 border-rose-500/20",
  Music:   "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  PE:      "text-lime-400 bg-lime-500/10 border-lime-500/20",
  Other:   "text-[var(--text-secondary)] bg-[var(--surface-hover)] border-[var(--border-color)]",
};

async function addAssignment(formData: FormData) {
  "use server";
  const title = (formData.get("title") as string).trim();
  const assignee = (formData.get("assignee") as string).trim();
  const subject = (formData.get("subject") as string) || "Other";
  const dueDate = (formData.get("dueDate") as string | null)?.trim() || null;
  if (!title || !assignee) return;
  await prisma.homework.create({ data: { title, assignee, subject, dueDate } });
  revalidatePath("/admin/homework");
}

async function toggleAssignment(id: string, completed: boolean) {
  "use server";
  await prisma.homework.update({ where: { id }, data: { completed: !completed } });
  revalidatePath("/admin/homework");
}

async function deleteAssignment(id: string) {
  "use server";
  await prisma.homework.delete({ where: { id } });
  revalidatePath("/admin/homework");
}

async function clearCompleted() {
  "use server";
  await prisma.homework.deleteMany({ where: { completed: true } });
  revalidatePath("/admin/homework");
}

export default async function HomeworkManager() {
  const assignments = await prisma.homework.findMany({
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { assignee: "asc" }, { subject: "asc" }],
  });

  // Group by assignee
  const grouped: Record<string, typeof assignments> = {};
  for (const hw of assignments) {
    if (!grouped[hw.assignee]) grouped[hw.assignee] = [];
    grouped[hw.assignee].push(hw);
  }

  const completedCount = assignments.filter((a) => a.completed).length;

  return (
    <>
      <AdminTopbar title="Homework Tracker" />
      <div className="p-8 flex flex-col gap-8">

        {/* Add assignment form */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-6 shrink-0">
          <form action={addAssignment} className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Assignment</label>
              <input name="title" required className="input" placeholder="e.g. Chapter 5 worksheet, Book report…" />
            </div>
            <div className="flex flex-col gap-1.5 min-w-[130px]">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Student</label>
              <input name="assignee" required className="input" placeholder="Name" />
            </div>
            <div className="flex flex-col gap-1.5 min-w-[130px]">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Subject</label>
              <select name="subject" className="input">
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[130px]">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Due Date</label>
              <input name="dueDate" className="input" placeholder="e.g. Apr 10" />
            </div>
            <button type="submit" className="btn btn-primary h-10 px-5 shrink-0">
              <Plus size={18} /> Add
            </button>
          </form>
        </div>

        {/* Clear completed */}
        {completedCount > 0 && (
          <div className="flex justify-end">
            <form action={clearCompleted}>
              <button type="submit" className="text-xs text-[var(--text-tertiary)] hover:text-red-400 transition-colors">
                Clear {completedCount} completed assignment{completedCount !== 1 ? "s" : ""}
              </button>
            </form>
          </div>
        )}

        {/* Assignments by student */}
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 glass rounded-full flex items-center justify-center border border-dashed border-[var(--border-color)]">
              <BookOpen size={28} className="text-[var(--text-tertiary)]" />
            </div>
            <p className="text-[var(--text-secondary)]">No assignments yet. Add one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(grouped).map(([assignee, items]) => {
              const done = items.filter((a) => a.completed).length;
              return (
                <div key={assignee} className="card flex flex-col">
                  <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-3">
                    <div className="w-8 h-8 glass bg-gradient-to-br from-blue-500/20 to-transparent rounded-xl flex items-center justify-center">
                      <BookOpen size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-base">{assignee}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {done}/{items.length} done · {items.length - done} pending
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-4">
                    {items.map((hw) => {
                      const colorClass = SUBJECT_COLORS[hw.subject] ?? SUBJECT_COLORS["Other"];
                      return (
                        <div
                          key={hw.id}
                          className={`flex items-start gap-2 p-2.5 rounded-xl border transition-all ${
                            hw.completed
                              ? "bg-[var(--surface-hover)] border-[var(--border-color)] opacity-50"
                              : "bg-[var(--surface-hover)] border-[var(--border-color)] hover:border-blue-500/30"
                          }`}
                        >
                          <form action={toggleAssignment.bind(null, hw.id, hw.completed)} className="shrink-0 mt-0.5">
                            <button
                              type="submit"
                              className={`transition-colors ${hw.completed ? "text-blue-400" : "text-[var(--text-secondary)] hover:text-blue-400"}`}
                            >
                              {hw.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
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
                              {hw.dueDate && (
                                <span className="text-[10px] text-[var(--text-tertiary)]">Due: {hw.dueDate}</span>
                              )}
                            </div>
                          </div>
                          <form action={deleteAssignment.bind(null, hw.id)} className="shrink-0">
                            <button
                              type="submit"
                              className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              aria-label={`Delete "${hw.title}"`}
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
