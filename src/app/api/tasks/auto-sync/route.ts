import { getTasksClient, GoogleNotConnectedError } from "@/lib/google-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type TaskListConfig = {
  name: string;
  googleTaskListId: string | null;
  lastSynced: string | null;
};

export async function POST() {
  try {
    const row = await prisma.config.findUnique({ where: { key: "task_lists" } });
    if (!row) return NextResponse.json({ synced: 0 });

    const lists: TaskListConfig[] = JSON.parse(row.value);
    const mapped = lists.filter((l) => l.googleTaskListId);
    if (mapped.length === 0) return NextResponse.json({ synced: 0 });

    const client = await getTasksClient();
    let totalSynced = 0;

    for (const list of mapped) {
      try {
        let allTasks: { title: string; completed: boolean; due: string | null }[] = [];
        let pageToken: string | undefined;
        do {
          const res = await client.tasks.list({
            tasklist: list.googleTaskListId!,
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
              due: t.due
                ? new Date(t.due).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : null,
            }))
          );
          pageToken = res.data.nextPageToken ?? undefined;
        } while (pageToken);

        await prisma.task.deleteMany({ where: { listName: list.name } });
        if (allTasks.length > 0) {
          await prisma.task.createMany({
            data: allTasks.map((t) => ({
              listName: list.name,
              title: t.title,
              completed: t.completed,
              dueDate: t.due,
            })),
          });
        }
        totalSynced += allTasks.length;
      } catch (err) {
        // Skip this list on error but continue with others
        console.error(`Auto-sync failed for list "${list.name}":`, err);
      }
    }

    // Update lastSynced timestamps
    const updatedLists = lists.map((l) =>
      l.googleTaskListId ? { ...l, lastSynced: new Date().toISOString() } : l
    );
    await prisma.config.update({
      where: { key: "task_lists" },
      data: { value: JSON.stringify(updatedLists) },
    });

    return NextResponse.json({ synced: totalSynced, lists: mapped.length });
  } catch (err) {
    console.error("Auto-sync error:", err);
    if (err instanceof GoogleNotConnectedError) {
      return NextResponse.json({ error: "Google not connected" }, { status: 401 });
    }
    return NextResponse.json({ error: "Auto-sync failed" }, { status: 500 });
  }
}
