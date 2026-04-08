import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/AdminTopbar";
import { revalidatePath } from "next/cache";
import { UtensilsCrossed, Pencil } from "lucide-react";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
const MEAL_LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

async function saveMeal(formData: FormData) {
  "use server";
  const dayOfWeek = parseInt(formData.get("dayOfWeek") as string);
  const mealType = formData.get("mealType") as string;
  const title = (formData.get("title") as string).trim();
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  if (!title) {
    // Delete if title cleared
    await prisma.mealPlan.deleteMany({ where: { dayOfWeek, mealType } });
  } else {
    await prisma.mealPlan.upsert({
      where: { dayOfWeek_mealType: { dayOfWeek, mealType } },
      update: { title, notes },
      create: { dayOfWeek, mealType, title, notes },
    });
  }
  revalidatePath("/admin/meals");
}

async function clearMeal(dayOfWeek: number, mealType: string) {
  "use server";
  await prisma.mealPlan.deleteMany({ where: { dayOfWeek, mealType } });
  revalidatePath("/admin/meals");
}

export default async function MealsManager() {
  const meals = await prisma.mealPlan.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
  });

  const todayDow = new Date().getDay();

  // Build a map: dayOfWeek -> mealType -> meal
  const mealMap: Record<number, Record<string, { id: string; title: string; notes: string | null }>> = {};
  for (const meal of meals) {
    if (!mealMap[meal.dayOfWeek]) mealMap[meal.dayOfWeek] = {};
    mealMap[meal.dayOfWeek][meal.mealType] = { id: meal.id, title: meal.title, notes: meal.notes };
  }

  return (
    <>
      <AdminTopbar title="Meal Planner" />
      <div className="p-8 flex flex-col gap-6">

        <p className="text-sm text-[var(--text-secondary)]">
          Set a weekly repeating meal plan. Click any cell to edit. Leave the title blank and save to clear a meal.
        </p>

        {/* Week grid */}
        <div className="flex flex-col gap-4">
          {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
            const isToday = dow === todayDow;
            return (
              <div
                key={dow}
                className={`card p-4 ${isToday ? "border-orange-500/40 bg-orange-500/5" : ""}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center glass ${isToday ? "bg-orange-500/20 border border-orange-500/30" : ""}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-orange-400" : "text-[var(--text-tertiary)]"}`}>
                      {DAY_SHORT[dow]}
                    </span>
                  </div>
                  <div>
                    <p className={`font-bold text-base ${isToday ? "text-orange-300" : ""}`}>{DAY_NAMES[dow]}</p>
                    {isToday && <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Today</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {MEAL_TYPES.map((mealType) => {
                    const existing = mealMap[dow]?.[mealType];
                    return (
                      <form key={mealType} action={saveMeal} className="flex flex-col gap-2">
                        <input type="hidden" name="dayOfWeek" value={dow} />
                        <input type="hidden" name="mealType" value={mealType} />
                        <label className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                          <UtensilsCrossed size={10} /> {MEAL_LABEL[mealType]}
                        </label>
                        <input
                          name="title"
                          className="input text-sm"
                          placeholder="e.g. Spaghetti Bolognese"
                          defaultValue={existing?.title || ""}
                        />
                        <input
                          name="notes"
                          className="input text-xs"
                          placeholder="Notes (optional)"
                          defaultValue={existing?.notes || ""}
                        />
                        <button
                          type="submit"
                          className="btn btn-secondary text-xs py-1.5 flex items-center gap-1 justify-center"
                        >
                          <Pencil size={11} /> Save
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
