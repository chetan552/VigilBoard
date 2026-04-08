import { UtensilsCrossed } from "lucide-react";
import { prisma } from "@/lib/prisma";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function MealPlannerWidget({ widget }: { widget: Widget }) {
  const config = typeof widget.config === "string" && widget.config
    ? JSON.parse(widget.config)
    : (widget.config || {});

  const mealType: string = config.mealType || "dinner";
  const title: string = config.title || "Meal Planner";
  const showHeader: boolean = config.showHeader !== false;
  const view: "week" | "today" = config.view || "week";

  const todayDow = new Date().getDay(); // 0=Sun

  const meals = await prisma.mealPlan.findMany({
    where: mealType === "all" ? {} : { mealType },
    orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }],
  });

  // Index by dayOfWeek -> mealType -> title
  const mealMap: Record<number, Record<string, { title: string; notes: string | null }>> = {};
  for (const meal of meals) {
    if (!mealMap[meal.dayOfWeek]) mealMap[meal.dayOfWeek] = {};
    mealMap[meal.dayOfWeek][meal.mealType] = { title: meal.title, notes: meal.notes };
  }

  const mealTypeLabel: Record<string, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
  };

  if (view === "today") {
    const todayMeals = mealMap[todayDow] ?? {};
    const mealTypes = mealType === "all" ? ["breakfast", "lunch", "dinner"] : [mealType];

    return (
      <div className="flex flex-col h-full w-full p-4 animate-fade-in">
        {showHeader && (
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <div className="w-8 h-8 glass bg-gradient-to-br from-orange-500/20 to-transparent rounded-xl flex items-center justify-center">
              <UtensilsCrossed size={16} className="text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Meals</p>
              <p className="text-sm font-semibold leading-tight">{DAY_NAMES_FULL[todayDow]}</p>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3 flex-grow justify-center">
          {mealTypes.map((mt) => {
            const meal = todayMeals[mt];
            return (
              <div key={mt} className="p-3 glass rounded-xl border border-[var(--border-color)]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-1">{mealTypeLabel[mt] ?? mt}</p>
                {meal ? (
                  <>
                    <p className="text-base font-semibold text-[var(--text-primary)]">{meal.title}</p>
                    {meal.notes && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{meal.notes}</p>}
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)] italic">Not planned</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Week view
  return (
    <div className="flex flex-col h-full w-full p-4 animate-fade-in">
      {showHeader && (
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="w-8 h-8 glass bg-gradient-to-br from-orange-500/20 to-transparent rounded-xl flex items-center justify-center">
            <UtensilsCrossed size={16} className="text-orange-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Meal Planner</p>
            <p className="text-sm font-semibold leading-tight">{title}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 flex-grow min-h-0 overflow-y-auto [touch-action:pan-y]">
        {DAY_NAMES_SHORT.map((day, dow) => {
          const isToday = dow === todayDow;
          const dayMeals = mealMap[dow] ?? {};
          const mealTypes = mealType === "all" ? ["breakfast", "lunch", "dinner"] : [mealType];

          return (
            <div
              key={dow}
              className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                isToday
                  ? "bg-orange-500/10 border-orange-500/30"
                  : "bg-[var(--surface-hover)] border-[var(--border-color)]"
              }`}
            >
              <div className={`w-10 text-center shrink-0 ${isToday ? "text-orange-400" : "text-[var(--text-tertiary)]"}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider">{day}</p>
                {isToday && <p className="text-[8px] text-orange-400 font-semibold">TODAY</p>}
              </div>
              <div className="flex-1 min-w-0">
                {mealTypes.map((mt) => {
                  const meal = dayMeals[mt];
                  return meal ? (
                    <div key={mt} className="flex items-baseline gap-1.5">
                      {mealType === "all" && (
                        <span className="text-[9px] text-orange-400 font-bold uppercase shrink-0">
                          {mt.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <p className={`text-sm truncate ${isToday ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                        {meal.title}
                      </p>
                    </div>
                  ) : (
                    <p key={mt} className="text-sm text-[var(--text-tertiary)] italic">—</p>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
