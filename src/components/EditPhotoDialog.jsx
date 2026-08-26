import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from './Bits';
import { useAuth } from '../lib/auth';
import { PHOTO_CATEGORIES } from '../lib/photoCategories';

export default function EditPhotoDialog({ photo, onClose, onSaved }) {
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('TEMPLE');
  const [personName, setPersonName] = useState('');
  const [personTitle, setPersonTitle] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    setCaption(photo?.caption || '');
    setCategory(photo?.category || 'TEMPLE');
    setPersonName(photo?.personName || '');
    setPersonTitle(photo?.personTitle || '');
    setFile(null);
  }, [photo]);

  useEffect(() => {
    if (!photo) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photo, onClose]);

  if (!photo) return null;

  // Only an admin may label a photograph as the Admin portrait — the backend
  // enforces this too, so hiding it here just avoids offering a choice that
  // would come back as a 403.
  const options = PHOTO_CATEGORIES.filter((c) => c.value !== 'ADMIN' || isAdmin);
  const isPerson = PHOTO_CATEGORIES.find((c) => c.value === category)?.person;
  const becomingPortrait = category === 'ADMIN' && photo.category !== 'ADMIN';
  const losingPortrait = photo.category === 'ADMIN' && category !== 'ADMIN';

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await api.updatePhoto(photo.id, {
        caption,
        category,
        // Sent as empty strings rather than omitted when the category has no
        // person, so switching a portrait back to a gallery photo actually
        // clears the name instead of leaving it stranded on the row.
        personName: isPerson ? personName : '',
        personTitle: isPerson ? personTitle : '',
        file,
      });
      // Handed back so the gallery can tell whether the portrait moved.
      onSaved(updated);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/50 p-4 sm:items-center">
      {/* max-h + scroll: this form is taller than a phone in landscape, and
          the save button was falling off the bottom with no way to reach it. */}
      <form onSubmit={save} className="card max-h-[90dvh] w-full max-w-md overflow-y-auto p-5">
        <h3 className="text-xl">Edit photo</h3>

        <label className="eyebrow mt-4 block" htmlFor="edit-category">
          Show this photo as
        </label>
        <select
          id="edit-category"
          className="field mt-1.5"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {options.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {becomingPortrait && (
          <p className="mt-2 rounded-lg bg-rose-temple/8 px-3 py-2 text-xs leading-relaxed text-rose-temple">
            This will become your account portrait, replacing the current one.
          </p>
        )}
        {losingPortrait && (
          <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-xs leading-relaxed text-muted">
            This is currently your portrait. Moving it out of “Admin” leaves you with no
            portrait until you set another.
          </p>
        )}

        {isPerson && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="eyebrow block" htmlFor="edit-person-name">
                Name
              </label>
              <input
                id="edit-person-name"
                className="field mt-1.5"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                maxLength={120}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="eyebrow block" htmlFor="edit-person-title">
                Title <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="edit-person-title"
                className="field mt-1.5"
                value={personTitle}
                onChange={(e) => setPersonTitle(e.target.value)}
                maxLength={120}
                placeholder="Secretary"
              />
            </div>
          </div>
        )}

        <label className="eyebrow mt-4 block" htmlFor="edit-caption">
          Caption
        </label>
        <input
          id="edit-caption"
          className="field mt-1.5"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={255}
          placeholder="Janmashtami darshan"
        />

        <label className="eyebrow mt-4 block" htmlFor="edit-file">
          Replace image
        </label>
        <input
          id="edit-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-1.5 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-night-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        <p className="mt-1 text-xs text-muted">Leave empty to keep the current image.</p>

        <div className="mt-5 flex gap-2">
          <button type="button" className="btn btn-quiet flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-peacock flex-1" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
