"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

interface DeleteScreenButtonProps {
  screenId: string;
  deleteAction: (id: string) => Promise<void>;
}

export function DeleteScreenButton({ screenId, deleteAction }: DeleteScreenButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this screen? All widgets will be lost.")) {
      startTransition(async () => {
        await deleteAction(screenId);
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10 p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      title={isPending ? "Deleting..." : "Delete Screen"}
      aria-label={isPending ? "Deleting..." : "Delete Screen"}
    >
      <Trash2 size={18} className={isPending ? "animate-pulse" : ""} />
    </button>
  );
}
