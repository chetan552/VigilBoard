import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/AdminTopbar";
import { notFound } from "next/navigation";
import { LayoutBuilder } from "./LayoutBuilder";

type Props = { params: Promise<{ id: string }> };

const DEFAULT_LIST_NAMES = ["Erel", "Asaph", "Eden", "Ashira"];

export default async function ScreenEditor(props: Props) {
  const params = await props.params;
  const [screen, listsConfig] = await Promise.all([
    prisma.screen.findUnique({ where: { id: params.id }, include: { widgets: true } }),
    prisma.config.findUnique({ where: { key: "task_lists" } }),
  ]);

  if (!screen) notFound();

  const taskListNames: string[] = listsConfig
    ? (JSON.parse(listsConfig.value) as { name: string }[]).map((l) => l.name)
    : DEFAULT_LIST_NAMES;

  return (
    <>
      <AdminTopbar title={screen.name} backHref="/admin" />
      <div className="flex-grow overflow-hidden flex flex-col bg-[var(--bg-color)]">
        <LayoutBuilder initialScreen={screen} taskListNames={taskListNames} />
      </div>
    </>
  );
}
