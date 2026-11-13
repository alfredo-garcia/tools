type Props = { message: string; "data-testid"?: string };

/**
 * Kit `Toast`: message only, no icon or close button; the screen that shows it removes it after
 * 4 s (ui_kit_registry). Sits above the bottom navigation.
 */
export function Toast({ message, "data-testid": testId }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={testId}
      className="fixed inset-x-md bottom-[calc(88px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-(--size-dialog-max) rounded-md bg-surface-1 p-md text-label text-text shadow-elevation-3 medium:bottom-lg"
    >
      {message}
    </div>
  );
}

export const TOAST_MS = 4_000;
