import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const screen = await prisma.screen.findUnique({
    where: { id },
    include: { widgets: true },
  });

  if (!screen) return notFound();

  const exportData = {
    name: screen.name,
    widgets: screen.widgets.map(({ id: _id, screenId: _sid, createdAt: _ca, updatedAt: _ua, ...w }) => w),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${screen.name.replace(/[^a-z0-9]/gi, '_')}_layout.json"`,
    },
  });
}
