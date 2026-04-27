// Pre-built screen layouts. Each widget is positioned on the 24-col × 12-row
// grid used by the live screen renderer. The `config` is a JSON-stringified
// blob matching the widget's expected shape.

export type TemplateWidget = {
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: object | null;
};

export type ScreenTemplate = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  widgets: TemplateWidget[];
};

export const SCREEN_TEMPLATES: ScreenTemplate[] = [
  {
    id: "family-wall",
    name: "Family Wall",
    description: "Clock, weather, calendar, photos, chores, and meal plan — the kitchen-counter classic.",
    emoji: "🏡",
    widgets: [
      { type: "clock",        x: 0,  y: 0, w: 8,  h: 4 },
      { type: "weather",      x: 8,  y: 0, w: 8,  h: 6 },
      { type: "photos",       x: 16, y: 0, w: 8,  h: 6, config: { fit: "cover", interval: 20 } },
      { type: "calendar",     x: 0,  y: 4, w: 8,  h: 8 },
      { type: "mealplanner",  x: 8,  y: 6, w: 8,  h: 6, config: { mealType: "dinner", view: "week" } },
      { type: "chorechart",   x: 16, y: 6, w: 8,  h: 6, config: { groupBy: "assignee" } },
    ],
  },
  {
    id: "kids-room",
    name: "Kid's Room",
    description: "Big clock, today's homework + chores, plus a daily quote and photos.",
    emoji: "🎒",
    widgets: [
      { type: "clock",       x: 0,  y: 0,  w: 12, h: 5 },
      { type: "photos",      x: 12, y: 0,  w: 12, h: 5, config: { fit: "cover", interval: 30 } },
      { type: "homework",    x: 0,  y: 5,  w: 8,  h: 7, config: { dueWithin: "this_week" } },
      { type: "chorechart",  x: 8,  y: 5,  w: 8,  h: 7, config: { groupBy: "assignee" } },
      { type: "quotes",      x: 16, y: 5,  w: 8,  h: 4 },
      { type: "countdown",   x: 16, y: 9,  w: 8,  h: 3 },
    ],
  },
  {
    id: "office-desk",
    name: "Office Desk",
    description: "Time, weather, work calendar, world clocks, news, and tasks.",
    emoji: "💼",
    widgets: [
      { type: "clock",      x: 0,  y: 0, w: 8,  h: 4 },
      { type: "weather",    x: 8,  y: 0, w: 8,  h: 6 },
      { type: "worldclock", x: 16, y: 0, w: 8,  h: 6 },
      { type: "calendar",   x: 0,  y: 4, w: 10, h: 8 },
      { type: "tasks",      x: 10, y: 6, w: 8,  h: 6 },
      { type: "news",       x: 18, y: 6, w: 6,  h: 6 },
    ],
  },
  {
    id: "morning-briefing",
    name: "Morning Briefing",
    description: "Big clock, weather, today's calendar agenda, today's tasks. Strip it down.",
    emoji: "☀️",
    widgets: [
      { type: "clock",   x: 0,  y: 0, w: 12, h: 6 },
      { type: "weather", x: 12, y: 0, w: 12, h: 6 },
      { type: "calendar", x: 0, y: 6, w: 14, h: 6 },
      { type: "tasks",   x: 14, y: 6, w: 10, h: 6 },
    ],
  },
  {
    id: "spiritual",
    name: "Faith & Reflection",
    description: "Verse of the day front and center, with quote, clock, and a photo.",
    emoji: "✨",
    widgets: [
      { type: "clock",   x: 0,  y: 0, w: 12, h: 5 },
      { type: "photos",  x: 12, y: 0, w: 12, h: 7, config: { fit: "cover", interval: 30 } },
      { type: "bible",   x: 0,  y: 5, w: 12, h: 4 },
      { type: "quotes",  x: 0,  y: 9, w: 12, h: 3 },
      { type: "calendar", x: 12, y: 7, w: 12, h: 5 },
    ],
  },
];
