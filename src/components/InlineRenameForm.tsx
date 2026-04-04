"use client";

export function InlineRenameForm({
  defaultValue,
  action,
  className,
}: {
  defaultValue: string;
  action: (formData: FormData) => Promise<void>;
  className?: string;
}) {
  return (
    <form action={action}>
      <input
        name="name"
        defaultValue={defaultValue}
        required
        className={className}
        onBlur={(e) => (e.target as HTMLInputElement).form?.requestSubmit()}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
    </form>
  );
}
