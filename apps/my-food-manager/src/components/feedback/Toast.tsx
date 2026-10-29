export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-sm items-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-3 text-sm shadow-elevation-3"
    >
      {message}
    </div>
  );
}
