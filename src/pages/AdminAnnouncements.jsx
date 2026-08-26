import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Spinner, EmptyState, ConfirmDialog, useToast } from '../components/Bits';
import { CATEGORY_META, CATEGORY_ORDER, to12Hour } from '../lib/temple';

const BLANK = {
  title: '',
  body: '',
  category: 'PUJA',
  pinned: false,
  published: true,
  eventDate: '',
  eventTime: '',
  visibleFrom: '',
  visibleUntil: '',
};

export default function AdminAnnouncements() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = form closed
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.adminAnnouncements());
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, message) => {
    try {
      await fn();
      toast(message);
      await load();
      return true;
    } catch (err) {
      toast(err.message, 'error');
      return false;
    }
  };

  const save = async (draft) => {
    const payload = {
      ...draft,
      // The backend takes null, not "", for the optional date fields.
      eventDate: draft.eventDate || null,
      eventTime: draft.eventTime || null,
      visibleFrom: draft.visibleFrom || null,
      visibleUntil: draft.visibleUntil || null,
    };

    const ok = await act(
      () => (draft.id ? api.updateAnnouncement(draft.id, payload) : api.createAnnouncement(payload)),
      draft.id ? 'Notice updated' : 'Notice posted',
    );
    if (ok) setEditing(null);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Temple administration</p>
      <h1 className="mt-1 text-3xl sm:text-4xl">Notices</h1>
      <p className="mt-2 text-sm text-muted">
        Anything posted here shows on the front page. Only admins can write notices; devotees and
        priests can read them without signing in.
      </p>

      {!editing && (
        <button className="btn btn-peacock mt-5" onClick={() => setEditing({ ...BLANK })}>
          Write a notice
        </button>
      )}

      {editing && (
        <NoticeForm
          draft={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {loading && !items ? (
        <Spinner label="Loading notices" />
      ) : !items?.length ? (
        <EmptyState
          title="No notices yet"
          body="Post the first one and it appears on the front page straight away."
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((a) => (
            <NoticeRow
              key={a.id}
              announcement={a}
              onEdit={() => setEditing(toDraft(a))}
              onTogglePublish={() =>
                act(
                  () => api.publishAnnouncement(a.id, !a.published),
                  a.published ? 'Notice hidden' : 'Notice published',
                )
              }
              onTogglePin={() =>
                act(
                  () => api.pinAnnouncement(a.id, !a.pinned),
                  a.pinned ? 'Notice unpinned' : 'Notice pinned to the top',
                )
              }
              onDelete={() => setRemoving(a)}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete this notice?"
        body={removing ? `"${removing.title}" comes off the front page permanently.` : ''}
        confirmLabel="Delete"
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          const target = removing;
          setRemoving(null);
          await act(() => api.deleteAnnouncement(target.id), 'Notice deleted');
        }}
      />
    </div>
  );
}

function toDraft(a) {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    category: a.category,
    pinned: a.pinned,
    published: a.published,
    eventDate: a.eventDate ?? '',
    eventTime: a.eventTime ? a.eventTime.slice(0, 5) : '',
    visibleFrom: a.visibleFrom ?? '',
    visibleUntil: a.visibleUntil ?? '',
  };
}

/* ------------------------------------------------------------------ */

function NoticeForm({ draft, onChange, onCancel, onSave }) {
  const [saving, setSaving] = useState(false);
  const set = (patch) => onChange({ ...draft, ...patch });

  const invalidWindow =
    draft.visibleFrom && draft.visibleUntil && draft.visibleUntil < draft.visibleFrom;
  const canSave = draft.title.trim() && draft.body.trim() && !invalidWindow && !saving;

  const submit = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };

  return (
    <section className="card mt-5 p-5">
      <h2 className="text-xl">{draft.id ? 'Edit notice' : 'New notice'}</h2>

      <div className="mt-4 flex flex-col gap-4">
        <label className="block">
          <span className="eyebrow">Title</span>
          <input
            className="field mt-1.5"
            value={draft.title}
            maxLength={200}
            placeholder="Sri Krishna Janmastami"
            onChange={(e) => set({ title: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="eyebrow">Notice</span>
          <textarea
            className="field mt-1.5 min-h-32 resize-y"
            value={draft.body}
            maxLength={5000}
            placeholder="What is happening, when, and what devotees should do."
            onChange={(e) => set({ body: e.target.value })}
          />
          <span className="mt-1 block text-xs text-muted">
            {draft.body.length} / 5000 · line breaks are kept
          </span>
        </label>

        <div>
          <span className="eyebrow">Category</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ category: c })}
                className={`btn !py-2 !text-xs ${
                  draft.category === c ? 'btn-primary' : 'btn-quiet'
                }`}
              >
                {CATEGORY_META[c].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow">Event date</span>
            <input
              type="date"
              className="field mt-1.5"
              value={draft.eventDate}
              onChange={(e) => set({ eventDate: e.target.value })}
            />
            <span className="mt-1 block text-xs text-muted">
              Leave empty for a standing notice
            </span>
          </label>

          <label className="block">
            <span className="eyebrow">Event time</span>
            <input
              type="time"
              className="field mt-1.5"
              value={draft.eventTime}
              onChange={(e) => set({ eventTime: e.target.value })}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow">Show from</span>
            <input
              type="date"
              className="field mt-1.5"
              value={draft.visibleFrom}
              onChange={(e) => set({ visibleFrom: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="eyebrow">Show until</span>
            <input
              type="date"
              className="field mt-1.5"
              value={draft.visibleUntil}
              onChange={(e) => set({ visibleUntil: e.target.value })}
            />
            <span className="mt-1 block text-xs text-muted">
              Notice removes itself after this date
            </span>
          </label>
        </div>

        {invalidWindow && (
          <p className="text-sm font-semibold text-rose-temple">
            &quot;Show until&quot; is earlier than &quot;show from&quot;, so nobody would see this
            notice. Widen the dates.
          </p>
        )}

        <div className="flex flex-wrap gap-4">
          <Toggle
            checked={draft.pinned}
            onChange={(v) => set({ pinned: v })}
            label="Pin to the top"
          />
          <Toggle
            checked={draft.published}
            onChange={(v) => set({ published: v })}
            label="Publish now"
          />
        </div>

        <div className="flex gap-2">
          <button className="btn btn-peacock" disabled={!canSave} onClick={submit}>
            {saving ? 'Saving' : draft.id ? 'Save changes' : 'Post notice'}
          </button>
          <button className="btn btn-quiet" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--color-peacock-600)]"
      />
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------ */

function NoticeRow({ announcement: a, onEdit, onTogglePublish, onTogglePin, onDelete }) {
  const meta = CATEGORY_META[a.category] ?? CATEGORY_META.GENERAL;

  return (
    <li className={`card p-4 ${a.published ? '' : 'opacity-70'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold tracking-wide ${meta.className}`}>
          {meta.label}
        </span>
        {a.pinned && (
          <span className="text-[0.68rem] font-bold tracking-wide text-muted">PINNED</span>
        )}
        {!a.published && (
          <span className="rounded-full bg-hairline px-2 py-0.5 text-[0.68rem] font-bold text-muted">
            Draft
          </span>
        )}
        {a.eventDate && (
          <span className="text-[0.72rem] font-semibold text-muted">
            {new Date(`${a.eventDate}T00:00:00`).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
            })}
            {a.eventTime ? ` · ${to12Hour(a.eventTime.slice(0, 5))}` : ''}
          </span>
        )}
      </div>

      <h3 className="mt-2 text-lg leading-snug">{a.title}</h3>
      <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-muted">{a.body}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-quiet !py-2 !text-xs" onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-quiet !py-2 !text-xs" onClick={onTogglePublish}>
          {a.published ? 'Hide' : 'Publish'}
        </button>
        <button className="btn btn-quiet !py-2 !text-xs" onClick={onTogglePin}>
          {a.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          className="btn !py-2 !text-xs bg-rose-temple/10 text-rose-temple"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
