import { getCalendarClient, GoogleNotConnectedError } from "@/lib/google-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth())); // 0-indexed
  const calendarId = searchParams.get("calendarId") || "primary";

  try {
    const calendar = await getCalendarClient();
    const res = await calendar.events.list({
      calendarId,
      timeMin: new Date(year, month, 1).toISOString(),
      timeMax: new Date(year, month + 1, 1).toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    const events = res.data.items?.map((e) => {
      const dateTime = e.start?.dateTime;
      const dateOnly = e.start?.date;
      let dayOfMonth: number;
      if (dateTime) {
        dayOfMonth = new Date(dateTime).getDate();
      } else if (dateOnly) {
        dayOfMonth = parseInt(dateOnly.split("-")[2], 10);
      } else {
        dayOfMonth = 1;
      }

      return {
        id: e.id ?? "",
        title: e.summary ?? "Untitled",
        time: dateTime
          ? new Date(dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "All Day",
        date: dayOfMonth,
      };
    }) ?? [];

    return NextResponse.json({ events, connected: true });
  } catch (err) {
    const needsReconnect = err instanceof GoogleNotConnectedError;
    return NextResponse.json({ events: [], connected: false, needsReconnect });
  }
}
