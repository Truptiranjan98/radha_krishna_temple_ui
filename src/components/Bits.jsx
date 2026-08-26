import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { ROLE_LABEL, ROLE_STYLE } from '../lib/auth';

/** A mor-pankh eye, borrowed from the peacock feather Krishna wears. */
export function FeatherMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <ellipse cx="20" cy="20" rx="11" ry="15" fill="var(--color-peacock-600)" opacity="0.9" />
      <ellipse cx="20" cy="19" rx="7" ry="9.5" fill="var(--color-night-800)" />
      <ellipse cx="20" cy="18" rx="3.6" ry="5" fill="var(--color-marigold-500)" />
      <ellipse cx="20" cy="17.4" rx="1.5" ry="2.2" fill="var(--color-night-950)" />
    </svg>
  );
}

/** The sacred syllable, softly glowing. Purely devotional — aria-hidden. */
export function OmMark({ className = 'text-5xl' }) {
  return (
    <span aria-hidden="true" className={`om-mark inline-block select-none leading-none ${className}`}>
      ॐ
    </span>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-hairline border-t-peacock-600" />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <FeatherMark className="h-10 w-10 opacity-60" />
      <h3 className="text-xl">{title}</h3>
      {body && <p className="max-w-sm text-sm text-muted">{body}</p>}
      {action}
    </div>
  );
}

export function RoleBadge({ role }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold tracking-wide ${
        ROLE_STYLE[role] || 'bg-hairline text-muted'
      }`}
    >
      {ROLE_LABEL[role] || role}
    </span>
  );
}

/* --------------------------- toasts --------------------------- */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, tone = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-24 z-50 flex flex-col items-center gap-2 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm text-white shadow-lg ${
              t.tone === 'error' ? 'bg-rose-temple' : 'bg-night-900'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || (() => {});
}

/* ------------------------ confirm dialog ------------------------ */

export function ConfirmDialog({ open, title, body, confirmLabel = 'Delete', onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/50 p-4 sm:items-center">
      <div className="card w-full max-w-sm p-5">
        <h3 className="text-lg">{title}</h3>
        {body && <p className="mt-2 text-sm text-muted">{body}</p>}
        <div className="mt-5 flex gap-2">
          <button className="btn btn-quiet flex-1" onClick={onCancel}>
            Keep it
          </button>
          <button
            className="btn flex-1 bg-rose-temple text-white"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
