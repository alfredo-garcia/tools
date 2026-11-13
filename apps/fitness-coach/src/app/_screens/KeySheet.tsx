"use client";
/** UX Flow 2.6: the stored key was rejected; asks for the new one over the current screen (FR-12, AC-12). */
import { useState, type FormEvent } from "react";
import { Button } from "@/components/inputs/Button";
import { TmpKeyField } from "@/components/inputs/TmpKeyField";
import { Sheet } from "@/components/overlays/Sheet";
import { useSync } from "@/lib/sync/provider";

const ERRORS = {
  invalid_key: "Esa clave no es correcta",
  offline: "Sin conexión. Inténtalo al volver la red.",
  error: "No se pudo conectar. Inténtalo de nuevo.",
} as const;

export function KeySheet() {
  const { state, submitKey, setKeySheetOpen } = useSync();
  const [keyDraft, setKeyDraft] = useState("");
  const [isKeyVisible, setKeyVisible] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [keyError, setKeyError] = useState<keyof typeof ERRORS | null>(null);

  const close = () => {
    setKeySheetOpen(false);
    setKeyDraft("");
    setKeyError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (keyDraft.length === 0 || isSubmitting) return;
    setSubmitting(true);
    const result = await submitKey(keyDraft);
    setSubmitting(false);
    if (result === "ok") {
      setKeyDraft("");
      setKeyError(null);
    } else {
      setKeyError(result);
    }
  };

  return (
    <Sheet
      open={state.keySheetOpen}
      onClose={close}
      title="Tu clave ya no vale"
      data-testid="key-sheet"
      closeTestId="key-sheet-close"
    >
      <form onSubmit={submit} className="flex flex-col gap-lg">
        <p className="text-body text-text-muted">
          Escribe la clave nueva para seguir actualizando. Tus datos guardados siguen aquí.
        </p>
        <TmpKeyField
          id="new-key"
          label="Clave de acceso"
          value={keyDraft}
          visible={isKeyVisible}
          error={keyError ? ERRORS[keyError] : null}
          disabled={isSubmitting}
          onChange={(v) => {
            setKeyDraft(v);
            setKeyError(null);
          }}
          onToggleVisible={() => setKeyVisible((v) => !v)}
          testIdPrefix="key-sheet"
        />
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          disabled={keyDraft.length === 0}
          data-testid="key-sheet-save"
        >
          Guardar
        </Button>
      </form>
    </Sheet>
  );
}
