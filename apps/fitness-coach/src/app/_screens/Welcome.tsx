"use client";
/** UX Flow 2.1: first open with network; asks for the key and validates it (FR-10, AC-10, AC-11). */
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/inputs/Button";
import { TmpKeyField } from "@/components/inputs/TmpKeyField";
import { useSync } from "@/lib/sync/provider";

type Props = { onOffline: () => void };

const ERRORS = {
  invalid_key: "Esa clave no es correcta",
  // Not in the UX Flow (only 401 and network are): a server or Drive failure on the first open.
  error: "No se pudo conectar. Inténtalo de nuevo.",
} as const;

export function Welcome({ onOffline }: Props) {
  const { submitKey } = useSync();
  const router = useRouter();
  const [keyDraft, setKeyDraft] = useState("");
  const [isKeyVisible, setKeyVisible] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [keyError, setKeyError] = useState<keyof typeof ERRORS | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (keyDraft.length === 0 || isSubmitting) return;
    setSubmitting(true);
    const result = await submitKey(keyDraft);
    // UX Flow 2.1: a 200 renders the Home, whatever URL the app was opened on
    if (result === "ok") router.replace("/");
    else if (result === "offline") onOffline();
    else {
      setKeyError(result);
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-(--size-dialog-max) flex-col justify-center gap-lg p-lg pt-[calc(var(--spacing-lg)+env(safe-area-inset-top))]">
      <div className="flex flex-col gap-sm">
        <h1 className="text-display">My Coach</h1>
        <p className="text-body text-text-muted">Escribe tu clave para empezar</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-lg">
        <TmpKeyField
          id="key"
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
          testIdPrefix="key"
        />
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          disabled={keyDraft.length === 0}
          data-testid="enter-button"
        >
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
