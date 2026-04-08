import { ClockWidget } from "./ClockWidget";
import { WeatherWidget } from "./WeatherWidget";
import { QuotesWidget } from "./QuotesWidget";
import { PhotosWidget } from "./PhotosWidget";
import { CalendarWidget } from "./CalendarWidget";
import { TasksWidget } from "./TasksWidget";
import { TextWidget } from "./TextWidget";
import { CountdownWidget } from "./CountdownWidget";
import { NewsWidget } from "./NewsWidget";
import { WorldClockWidget } from "./WorldClockWidget";
import { DataFetchWidget } from "./DataFetchWidget";
import { BibleWidget } from "./BibleWidget";
import type { DisplayPrefs } from "@/lib/prefs";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

export function WidgetRenderer({ widget, prefs }: { widget: Widget; prefs?: DisplayPrefs }) {
  switch (widget.type) {
    case 'clock':
      return <ClockWidget widget={widget} timeFormat={prefs?.timeFormat ?? "12h"} />;
    case 'weather':
      return <WeatherWidget widget={widget} tempUnit={prefs?.tempUnit ?? "fahrenheit"} />;
    case 'quotes':
      return <QuotesWidget widget={widget} />;
    case 'photos':
      return <PhotosWidget widget={widget} />;
    case 'calendar':
      return <CalendarWidget widget={widget} />;
    case 'tasks':
      return <TasksWidget widget={widget} />;
    case 'text':
      return <TextWidget widget={widget} />;
    case 'countdown':
      return <CountdownWidget widget={widget} />;
    case 'news':
      return <NewsWidget widget={widget} />;
    case 'worldclock':
      return <WorldClockWidget widget={widget} />;
    case 'datafetch':
      return <DataFetchWidget widget={widget} />;
    case 'bible':
      return <BibleWidget widget={widget} />;
    default:
      return <div className="p-4 flex items-center justify-center h-full">Unknown Widget</div>;
  }
}
