import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/AdminTopbar";
import Link from "next/link";
import { Plus, Eye, Edit, Calendar, Clock, Cloud, Image, Quote, List, Type, Download, Timer, Rss, Globe, Sparkles } from "lucide-react";
import { revalidatePath } from "next/cache";
import { DeleteScreenButton } from "@/components/DeleteScreenButton";
import { DuplicateScreenButton } from "@/components/DuplicateScreenButton";
import { ImportScreenButton } from "@/components/ImportScreenButton";
import { InlineRenameForm } from "@/components/InlineRenameForm";
import { SCREEN_TEMPLATES } from "@/lib/screen-templates";
import { redirect } from "next/navigation";
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

async function createFromTemplate(templateId: string) {
  "use server";
  const template = SCREEN_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return;
  const screen = await prisma.screen.create({
    data: {
      name: template.name,
      widgets: {
        create: template.widgets.map(({ type, x, y, w, h, config }) => ({
          type,
          x,
          y,
          w,
          h,
          config: config ? JSON.stringify(config) : null,
        })),
      },
    },
  });
  revalidatePath("/admin");
  redirect(`/admin/screen/${screen.id}`);
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

        {screens.length === 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-[var(--accent-teal)]" />
              <h3 className="text-lg font-bold">Start from a template</h3>
              <span className="text-xs text-[var(--text-tertiary)]">— or create a blank screen above</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SCREEN_TEMPLATES.map((tpl) => (
                <form key={tpl.id} action={createFromTemplate.bind(null, tpl.id)}>
                  <button
                    type="submit"
                    className="card group hover:border-[var(--accent-teal)] transition-colors text-left p-5 w-full h-full flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{tpl.emoji}</span>
                      <h4 className="font-bold text-base">{tpl.name}</h4>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1">{tpl.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--accent-teal)] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={12} /> Create from template
                    </div>
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

        {screens.length > 0 && (
          <details className="mb-6">
            <summary className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-secondary)] hover:text-[var(--accent-teal)] transition-colors mb-3 list-none">
              <Sparkles size={14} />
              <span>Add another screen from a template</span>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {SCREEN_TEMPLATES.map((tpl) => (
                <form key={tpl.id} action={createFromTemplate.bind(null, tpl.id)}>
                  <button
                    type="submit"
                    className="card group hover:border-[var(--accent-teal)] transition-colors text-left p-4 w-full flex items-center gap-3"
                  >
                    <span className="text-xl">{tpl.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{tpl.name}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] truncate">{tpl.description}</p>
                    </div>
                  </button>
                </form>
              ))}
            </div>
          </details>
        )}

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
