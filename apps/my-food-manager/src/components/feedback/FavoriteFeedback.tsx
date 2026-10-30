"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/components/feedback/Toast";
import { KeyDialog } from "@/components/pantry/KeyDialog";
import { getOutbox } from "@/lib/offline/outbox-client";
import { FAVORITE_TOGGLED, OPEN_KEY_DIALOG } from "@/lib/offline/use-favorites";
import { useLibrary } from "@/lib/offline/use-library";
import { useOutbox } from "@/lib/offline/use-outbox";

const NOTICE_MS = 4000;

/**
 * Write key dialog and rejection notice for favorite toggles. Mounted once in the app frame because hearts live in
 * the list, the detail (also over the Plan) and Perfil. The key is asked at the first toggle without one; a key the
 * server refuses is asked again until the dialog is closed.
 */
export function FavoriteFeedback() {
  const outbox = useOutbox();
  const { library } = useLibrary();
  const [keyOpen, setKeyOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [rejectionClosed, setRejectionClosed] = useState(false);

  const hasKey = outbox.hasKey;
  useEffect(() => {
    const onToggle = () => {
      setTouched(true);
      if (!hasKey && !dismissed) setKeyOpen(true);
    };
    const onOpen = () => setKeyOpen(true);
    window.addEventListener(FAVORITE_TOGGLED, onToggle);
    window.addEventListener(OPEN_KEY_DIALOG, onOpen);
    return () => {
      window.removeEventListener(FAVORITE_TOGGLED, onToggle);
      window.removeEventListener(OPEN_KEY_DIALOG, onOpen);
    };
  }, [hasKey, dismissed]);

  const notice = outbox.notices.find((n) => n.favorite);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => getOutbox().dismissNotice(notice.id), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const dialogOpen = keyOpen || (touched && outbox.keyRejected && !rejectionClosed);
  const title = library?.recipes.find((r) => r.id === notice?.recipe)?.title ?? "la receta";
  return (
    <>
      {dialogOpen && (
        <KeyDialog
          rejected={outbox.keyRejected}
          onSave={(key) => {
            setKeyOpen(false);
            setDismissed(false);
            setRejectionClosed(false);
            getOutbox().setKey(key);
          }}
          onClose={() => {
            setKeyOpen(false);
            setDismissed(true);
            setRejectionClosed(true);
          }}
        />
      )}
      {notice && <Toast message={`No se pudo guardar ${title}`} />}
    </>
  );
}
