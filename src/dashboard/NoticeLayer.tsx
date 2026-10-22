// Messages of the dashboard (notices.ts) in the look of the active skin (tokens of skins.css): toasts at the bottom
// right, a click closes one; an error as a modal dialog that must be closed, with its details to copy for the admin.
// Screen readers hear the toasts (live region), the dialog takes the focus.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { closeError, currentError, currentToasts, dismissToast, subscribeNotices } from "./notices.ts";
import { TEXTS } from "./texts.de.ts";

const TEXT = TEXTS.notices;

export default function NoticeLayer() {
  const toasts = useSyncExternalStore(subscribeNotices, currentToasts);
  return (
    <>
      <div className="toasts" aria-live="polite">
        {toasts.map(item => (
          <button key={item.id} className="toast" role="status" title={TEXT.close} onClick={() => dismissToast(item.id)}>{item.text}</button>
        ))}
      </div>
      <ErrorDialog />
    </>
  );
}

function ErrorDialog() {
  const error = useSyncExternalStore(subscribeNotices, currentError);
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setCopied(false);
    if (error && !dialog.current?.open) dialog.current?.showModal();
  }, [error]);
  const copy = () => { if (error) void navigator.clipboard.writeText(error.details).then(() => setCopied(true)).catch(() => setCopied(false)); };
  return (
    <dialog ref={dialog} className="panel error-dialog" aria-labelledby="error-dialog-title" onClose={closeError}>
      {error && (
        <>
          <h2 id="error-dialog-title">{TEXT.errorTitle}</h2>
          <p>{error.text}</p>
          <p className="muted">{TEXT.errorHint}</p>
          <pre className="error-details">{error.details}</pre>
          <p className="actions">
            <button className="btn" onClick={copy}>{copied ? TEXT.copied : TEXT.copy}</button>
            <button className="btn primary" autoFocus onClick={() => dialog.current?.close()}>{TEXT.close}</button>
          </p>
        </>
      )}
    </dialog>
  );
}
