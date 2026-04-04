"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

export async function saveWidgets(screenId: string, widgets: Widget[]) {
  // Replace existing widgets with the new layout
  await prisma.widget.deleteMany({ where: { screenId } });
  
  await prisma.widget.createMany({
    data: widgets.map(w => ({
      id: w.id || undefined, // keep id if present, otherwise auto
      screenId,
      type: w.type,
      x: Math.max(0, Number(w.x)),
      y: Math.max(0, Number(w.y)),
      w: Math.max(1, Number(w.w)),
      h: Math.max(1, Number(w.h)),
      config: w.config || null
    }))
  });
  
  revalidatePath(`/admin/screen/${screenId}`);
  revalidatePath(`/screen/${screenId}`);
}
