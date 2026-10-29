import { ExternalLink } from "lucide-react";
import { notesView } from "@/lib/domain/recipe-detail";
import type { Recipe } from "@/lib/schema";
import { CollapsibleSection } from "./CollapsibleSection";

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mt-3 mb-1 text-xs font-extrabold tracking-[0.06em] text-text-muted uppercase first:mt-0">
    {children}
  </h3>
);

/** Not rendered at all when the recipe has no notes, variations or source. */
export function NotesSection({ recipe }: { recipe: Recipe }) {
  const view = notesView(recipe);
  if (!view) return null;
  return (
    <CollapsibleSection title="Notas">
      {view.notes.length > 0 && (
        <>
          <Heading>Notas</Heading>
          <ul className="list-disc pl-5">
            {view.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </>
      )}
      {view.variations && (
        <>
          <Heading>Variaciones</Heading>
          <p>{view.variations}</p>
        </>
      )}
      {view.source && (
        <>
          <Heading>Fuente</Heading>
          <p>
            {view.source.text}
            {view.source.url && (
              <a
                href={view.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-8 items-center gap-1 text-primary-500 ${view.source.text ? "ml-2" : ""}`}
              >
                Abrir enlace
                <ExternalLink aria-hidden className="size-3.5" />
              </a>
            )}
          </p>
        </>
      )}
    </CollapsibleSection>
  );
}
