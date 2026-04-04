import { getTasksClient, GoogleNotConnectedError } from "@/lib/google-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tasks = await getTasksClient();
    const res = await tasks.tasklists.list({ maxResults: 50 });
    const lists = res.data.items?.map((l) => ({
      id: l.id ?? "",
      title: l.title ?? "Untitled",
    })) ?? [];
    return NextResponse.json({ lists, connected: true });
  } catch (err) {
    const needsReconnect = err instanceof GoogleNotConnectedError;
    return NextResponse.json({ lists: [], connected: false, needsReconnect });
  }
}
