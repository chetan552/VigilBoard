import { getTasksClient, GoogleNotConnectedError } from "@/lib/google-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { listName, googleTaskListId } = await req.json();
    if (!listName || !googleTaskListId) {
      return NextResponse.json({ error: "Missing listName or googleTaskListId" }, { status: 400 });
    }

    const client = await getTasksClient();

    // Fetch all tasks (handle pagination)
    let allTasks: { title: string; completed: boolean; due: string | null }[] = [];
    let pageToken: string | undefined;
    do {
      const res = await client.tasks.list({
        tasklist: googleTaskListId,
        showCompleted: true,
        showHidden: true,
        maxResults: 100,
        pageToken,
      });
      const items = res.data.items ?? [];
      allTasks = allTasks.concat(
        items.map((t) => ({
          title: t.title ?? "Untitled",
          completed: t.status === "completed",
          due: t.due ? new Date(t.due).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null,
        }))
      );
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);

    // Replace local tasks for this list
    await prisma.task.deleteMany({ where: { listName } });
    if (allTasks.length > 0) {
      await prisma.task.createMany({
        data: allTasks.map((t) => ({
          listName,
          title: t.title,
          completed: t.completed,
          dueDate: t.due,
        })),
      });
    }

    // Update last synced timestamp in list config
    const raw = await prisma.config.findUnique({ where: { key: "task_lists" } });
    if (raw) {
      const lists: { name: string; googleTaskListId: string | null; lastSynced: string | null }[] = JSON.parse(raw.value);
      const updated = lists.map((l) =>
        l.name === listName ? { ...l, lastSynced: new Date().toISOString() } : l
      );
      await prisma.config.update({ where: { key: "task_lists" }, data: { value: JSON.stringify(updated) } });
    }

    return NextResponse.json({ synced: allTasks.length });
  } catch (err) {
    console.error("Sync error:", err);
    if (err instanceof GoogleNotConnectedError) {
      return NextResponse.json({ error: "Google not connected", needsReconnect: true }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("notFound") || msg.includes("404")) {
      return NextResponse.json({ error: "Task list not found — try remapping in Settings" }, { status: 404 });
    }
    if (msg.includes("forbidden") || msg.includes("403")) {
      return NextResponse.json({ error: "Access denied — reconnect Google in Settings" }, { status: 403 });
    }
    return NextResponse.json({ error: "Sync failed — check your connection and try again" }, { status: 500 });
  }
}
