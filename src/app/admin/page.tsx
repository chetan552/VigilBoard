import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/AdminTopbar";
import Link from "next/link";
import { Plus, Eye, Edit, Calendar, Clock, Cloud, Image, Quote, List, Type, Download, Timer, Rss, Globe } from "lucide-react";
import { revalidatePath } from "next/cache";
import { DeleteScreenButton } from "@/components/DeleteScreenButton";
import { DuplicateScreenButton } from "@/components/DuplicateScreenButton";
import { ImportScreenButton } from "@/components/ImportScreenButton";
import { InlineRenameForm } from "@/components/InlineRenameForm";
import React from "react";

async function createScreen(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  if (!name) return;
  await prisma.screen.create({ data: { name } });
  revalidatePath("/admin");
}

async function renameScreen(id: string, formData: FormData) {
  "use server";
  const name = (formData.get("name") as string).trim();
  if (!name) return;
  await prisma.screen.update({ where: { id }, data: { name } });
  revalidatePath("/admin");
}

async function deleteScreen(id: string) {
  "use server";
  await prisma.screen.delete({ where: { id } });
  revalidatePath("/admin");
}

async function duplicateScreen(id: string) {
  "use server";
  const source = await prisma.screen.findUnique({
    where: { id },
    include: { widgets: true },
  });
  if (!source) return;
  await prisma.screen.create({
    data: {
      name: `${source.name} (Copy)`,
      widgets: {
        create: source.widgets.map(({ type, x, y, w, h, config }) => ({
          type, x, y, w, h, config,
        })),
      },
    },
  });
  revalidatePath("/admin");
}

async function importScreen(name: string, widgets: unknown[]) {
  "use server";
  await prisma.screen.create({
    data: {
      name,
      widgets: {
        create: (widgets as { type: string; x: number; y: number; w: number; h: number; config?: string | null }[]).map(
          ({ type, x, y, w, h, config }) => ({ type, x, y, w, h, config: config ?? null })
        ),
      },
    },
  });
  revalidatePath("/admin");
}

const widgetIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number }>> = {
  clock: Clock,
  weather: Cloud,
  calendar: Calendar,
  photos: Image,
  quotes: Quote,
  tasks: List,
  text: Type,
  countdown: Timer,
  news: Rss,
  worldclock: Globe,
};

export default async function AdminDashboard() {
  const screens = await prisma.screen.findMany({
    orderBy: { createdAt: "desc" },
    include: { widgets: true },
  });

  return (
    <>
      <AdminTopbar title="Dashboard" />
      <div className="p-10 h-full overflow-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Your Screens</h2>
            <p className="text-[var(--text-secondary)] mt-2">
              Create and manage dashboard screens for different displays
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <ImportScreenButton importAction={importScreen} />
            <form action={createScreen} className="flex gap-3">
              <input
                name="name"
                placeholder="Enter screen name..."
                className="input w-56"
                required
              />
              <button type="submit" className="btn btn-primary whitespace-nowrap">
                <Plus size={20} /> Create Screen
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((screen) => (
            <div key={screen.id} className="card card-hover group hover:border-[var(--accent-teal)]">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0 flex-1">
                    <InlineRenameForm
                      defaultValue={screen.name}
                      action={renameScreen.bind(null, screen.id)}
                      className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-[var(--border-color)] focus:border-[var(--accent-teal)] outline-none w-full truncate transition-colors mb-1"
                    />
                    <p className="text-sm text-[var(--text-secondary)]">
                      Created {new Date(screen.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <DuplicateScreenButton screenId={screen.id} duplicateAction={duplicateScreen} />
                    <a
                      href={`/api/screens/${screen.id}/export`}
                      download
                      className="text-[var(--text-secondary)] hover:text-[var(--accent-teal)] hover:bg-[var(--accent-teal)]/10 p-2 rounded-lg transition-all hover:scale-105"
                      title="Export layout JSON"
                      aria-label="Export layout JSON"
                    >
                      <Download size={18} />
                    </a>
                    <DeleteScreenButton screenId={screen.id} deleteAction={deleteScreen} />
                  </div>
                </div>

                {screen.widgets.length > 0 ? (
                  <div className="mb-6">
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      {screen.widgets.length} widget{screen.widgets.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {screen.widgets.slice(0, 4).map((widget) => {
                        const Icon = widgetIcons[widget.type] || Type;
                        return (
                          <div
                            key={widget.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--surface-hover)] rounded-lg border border-[var(--border-color)] hover:border-[var(--accent-teal)] transition-colors duration-200"
                          >
                            <Icon size={14} className="text-[var(--accent-teal)]" />
                            <span className="text-xs font-medium capitalize">{widget.type}</span>
                          </div>
                        );
                      })}
                      {screen.widgets.length > 4 && (
                        <div className="px-2.5 py-1.5 bg-[var(--surface-hover)] rounded-lg border border-[var(--border-color)] hover:border-[var(--accent-teal)] transition-colors duration-200">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            +{screen.widgets.length - 4} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-[var(--surface-hover)] rounded-lg border border-dashed border-[var(--border-color)] hover:border-[var(--accent-teal)] transition-colors duration-200">
                    <p className="text-sm text-[var(--text-secondary)] text-center">
                      No widgets added yet
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Link
                    href={`/admin/screen/${screen.id}`}
                    className="btn btn-secondary flex-1"
                  >
                    <Edit size={18} /> Edit Layout
                  </Link>
                  <Link
                    href={`/screen/${screen.id}`}
                    target="_blank"
                    className="btn btn-primary flex-1"
                  >
                    <Eye size={18} /> View Live
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {screens.length === 0 && (
            <div className="col-span-full card border-2 border-dashed glass">
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-[var(--surface-hover)] rounded-full flex items-center justify-center border border-dashed border-[var(--border-color)] animate-pulse-glow">
                  <Plus size={32} className="text-[var(--text-secondary)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No screens yet</h3>
                <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                  Create your first screen to start building your dashboard
                </p>
                <form action={createScreen} className="flex gap-3 max-w-sm mx-auto">
                  <input
                    name="name"
                    placeholder="Enter screen name..."
                    className="input flex-grow"
                    required
                  />
                  <button type="submit" className="btn btn-primary">
                    Create
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
