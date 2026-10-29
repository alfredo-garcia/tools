import type { LucideIcon } from "lucide-react";

export function TmpComingSoon({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <div className="mx-auto mb-4 grid size-[72px] place-items-center rounded-full bg-surface-2 text-text-muted">
          <Icon className="size-8" aria-hidden />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-text-muted">Próximamente</p>
      </div>
    </main>
  );
}
