import { getCalendarClient, GoogleNotConnectedError } from "@/lib/google-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const calendar = await getCalendarClient();
    const res = await calendar.calendarList.list({ maxResults: 50 });
    const lists = res.data.items?.map((c) => ({
      id: c.id ?? "",
      title: c.summary ?? "Untitled",
    })) ?? [];
    return NextResponse.json({ lists, connected: true });
  } catch (err) {
    const needsReconnect = err instanceof GoogleNotConnectedError;
    return NextResponse.json({ lists: [], connected: false, needsReconnect });
  }
}
