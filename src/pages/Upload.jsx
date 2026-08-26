import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Bits';
import { PHOTO_CATEGORIES } from '../lib/photoCategories';

// Mirrors StorageService.ALLOWED_TYPES so we fail fast instead of
// round-tripping to the server for a 400.
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 10 * 1024 * 1024;

export default function Upload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('TEMPLE');
  const [personName, setPersonName] = useState('');
  const [personTitle, setPersonTitle] = useState('');
  const [categories, setCategories] = useState(PHOTO_CATEGORIES);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { user, reloadAccount } = useAuth();

  // The backend owns the list; the bundled copy is only a fallback so the form
  // is usable before this lands (or if it fails).
  useEffect(() => {
    api
      .photoCategories()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          // Keep the bundled hint text, which the API does not carry.
          setCategories(
            list.map((c) => ({
              ...c,
              hint: PHOTO_CATEGORIES.find((local) => local.value === c.value)?.hint,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selected = categories.find((c) => c.value === category) ?? categories[0];
  const isPerson = Boolean(selected?.person);
  const isPortrait = category === 'ADMIN';

  const accept = (candidate) => {
    if (!candidate) return;
    if (!ALLOWED.includes(candidate.type)) {
      toast('Choose a JPEG, PNG, WEBP or GIF image.', 'error');
      return;
    }
    if (candidate.size > MAX_BYTES) {
      toast('That image is over 10MB. Pick a smaller one.', 'error');
      return;
    }
    setFile(candidate);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;

    // Replacing your own face is the one destructive thing this form can do,
    // so it asks. Every other category is additive and just saves.
    if (isPortrait) {
      const ok = window.confirm(
        'This will replace your account portrait with the selected image. Continue?',
      );
      if (!ok) return;
    }

    setBusy(true);
    try {
      await api.upload(file, {
        caption: caption.trim(),
        category,
        personName: isPerson ? personName.trim() : '',
        personTitle: isPerson ? personTitle.trim() : '',
      });

      // Only an Admin-category upload can have moved the portrait, so only
      // then is there any reason to re-read the account.
      if (isPortrait) {
        await reloadAccount();
        toast('Your portrait has been updated');
      } else {
        toast(`Photo added as ${selected?.label ?? 'a gallery photo'}`);
      }

      navigate('/mine');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <p className="eyebrow">Add to the collection</p>
      <h1 className="mt-1 text-3xl sm:text-4xl">Upload a photo</h1>

      <form onSubmit={submit} className="mt-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files?.[0]);
          }}
          className={`card grid place-items-center overflow-hidden p-0 transition-colors ${
            dragging ? 'border-peacock-500 bg-peacock-600/5' : ''
          }`}
        >
          {preview ? (
            <div className="w-full">
              <img
                src={preview}
                alt="Selected photo preview"
                className="arch max-h-80 w-full object-cover"
              />
              <div className="flex items-center justify-between gap-3 p-3">
                <span className="min-w-0 truncate text-sm text-muted">{file.name}</span>
                <button
                  type="button"
                  className="btn btn-quiet !py-2 !text-xs"
                  onClick={() => setFile(null)}
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 px-6 py-14 text-center"
            >
              <svg viewBox="0 0 24 24" className="h-9 w-9 fill-peacock-600" aria-hidden="true">
                <path d="M11 16V9.8l-2.6 2.6L7 11l5-5 5 5-1.4 1.4L13 9.8V16h-2ZM5 20v-4h2v2h10v-2h2v4H5Z" />
              </svg>
              <span className="font-semibold">Choose an image</span>
              <span className="text-sm text-muted">
                or drag one here · JPEG, PNG, WEBP, GIF · up to 10MB
              </span>
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED.join(',')}
          className="sr-only"
          onChange={(e) => accept(e.target.files?.[0])}
        />

        {/* ---------------- where the photo goes ---------------- */}

        <fieldset className="mt-6">
          <legend className="eyebrow">Show this photo as</legend>
          <p className="mt-1 text-sm text-muted">
            Committee photographs appear on the front page. Only “Admin” changes your own
            account picture.
          </p>

          <div className="mt-3 grid gap-2">
            {categories.map((c) => (
              <label
                key={c.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                  category === c.value
                    ? 'border-peacock-500 bg-peacock-600/5'
                    : 'border-hairline hover:bg-paper'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  checked={category === c.value}
                  onChange={() => setCategory(c.value)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-peacock-600)]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{c.label}</span>
                  {c.hint && <span className="mt-0.5 block text-xs text-muted">{c.hint}</span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {isPortrait && (
          <p className="mt-3 rounded-lg bg-rose-temple/8 px-3 py-2.5 text-xs leading-relaxed text-rose-temple">
            This replaces your current account picture, shown in the header and on your
            profile. Uploading under any other category leaves it untouched.
          </p>
        )}

        {isPerson && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="eyebrow block" htmlFor="person-name">
                Name
              </label>
              <input
                id="person-name"
                className="field mt-1.5"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                maxLength={120}
                placeholder={isPortrait ? user?.name || 'Your name' : 'Full name'}
              />
            </div>
            <div>
              <label className="eyebrow block" htmlFor="person-title">
                Title <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="person-title"
                className="field mt-1.5"
                value={personTitle}
                onChange={(e) => setPersonTitle(e.target.value)}
                maxLength={120}
                placeholder="Secretary"
              />
            </div>
          </div>
        )}

        <label className="eyebrow mt-5 block" htmlFor="caption">
          Caption <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="caption"
          className="field mt-1.5"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={255}
          placeholder={isPerson ? 'A few words about them' : 'Janmashtami darshan'}
        />

        <button type="submit" className="btn btn-peacock mt-6 w-full" disabled={!file || busy}>
          {busy ? 'Uploading…' : isPortrait ? 'Set as my portrait' : 'Add to gallery'}
        </button>
      </form>
    </div>
  );
}
