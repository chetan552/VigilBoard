"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Server actions invoked from the live screen's long-press quick-actions menu.
// All revalidate "/" layout so any active screen re-renders.

export async function clearCompletedTasks(listName: string) {
  await prisma.task.deleteMany({ where: { listName, completed: true } });
  revalidatePath("/", "layout");
}

export async function resetTodayChores(filterAssignee: string | null) {
  await prisma.chore.updateMany({
    where: {
      ...(filterAssignee ? { assignee: filterAssignee } : {}),
      completedOn: { not: null },
    },
    data: { completedOn: null },
  });
  revalidatePath("/", "layout");
}

export async function clearCompletedHomework(filterAssignee: string | null) {
  await prisma.homework.deleteMany({
    where: {
      ...(filterAssignee ? { assignee: filterAssignee } : {}),
      completed: true,
    },
  });
  revalidatePath("/", "layout");
}
