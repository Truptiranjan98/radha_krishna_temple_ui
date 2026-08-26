import { useState } from 'react';
import AuthedImage from './AuthedImage';
import { RoleBadge } from './Bits';
import { CATEGORY_LABEL, CATEGORY_STYLE } from '../lib/photoCategories';

function when(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PhotoCard({ photo, canModify, isProfilePhoto = false, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

  const categoryLabel = photo.categoryLabel || CATEGORY_LABEL[photo.category];
  // The plain gallery is the default and the overwhelming majority of the
  // grid; badging every one of those adds noise without telling anyone
  // anything. Only the people categories get a badge.
  const showCategory = Boolean(categoryLabel) && photo.category !== 'TEMPLE';

  // What to call this picture when a screen reader reads it, in the order a
  // person would: who is in it, else the caption, else the filename.
  const label = photo.personName || photo.caption || photo.originalFileName;

  return (
    <figure className="card overflow-hidden">
      {/* The arch is the signature: a temple doorway, not a rectangle. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in bg-night-900/5"
        aria-label={`View ${label} full size`}
      >
        <AuthedImage
          photoId={photo.id}
          alt={label}
          className="arch aspect-[4/5] w-full object-cover"
        />
      </button>

      <figcaption className="p-3.5">
        {(showCategory || isProfilePhoto) && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {showCategory && (
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold tracking-wide ${
                  CATEGORY_STYLE[photo.category] || 'bg-hairline text-muted'
                }`}
              >
                {categoryLabel}
              </span>
            )}
            {/* Makes it obvious which single photograph is the account
                portrait, so it is not deleted by accident. */}
            {isProfilePhoto && (
              <span className="rounded-full bg-peacock-600/10 px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-peacock-600">
                YOUR PORTRAIT
              </span>
            )}
          </div>
        )}

        {photo.personName ? (
          <>
            <p className="truncate text-sm font-semibold leading-snug">{photo.personName}</p>
            {photo.personTitle && (
              <p className="mt-0.5 truncate text-xs text-muted">{photo.personTitle}</p>
            )}
          </>
        ) : photo.caption ? (
          <p className="text-sm font-medium leading-snug">{photo.caption}</p>
        ) : (
          <p className="text-sm italic text-muted">No caption</p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="font-semibold text-night-900">{photo.ownerName}</span>
          <RoleBadge role={photo.ownerRole} />
          <span aria-hidden="true">·</span>
          <time dateTime={photo.createdAt}>{when(photo.createdAt)}</time>
        </div>

        {canModify && (
          <div className="mt-3 flex gap-2">
            <button className="btn btn-quiet flex-1 !py-2 !text-xs" onClick={() => onEdit(photo)}>
              Edit
            </button>
            <button
              className="btn flex-1 !py-2 !text-xs bg-rose-temple/10 text-rose-temple"
              onClick={() => onDelete(photo)}
            >
              Delete
            </button>
          </div>
        )}
      </figcaption>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/90 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <AuthedImage
            photoId={photo.id}
            alt={label}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          {/*
            Needs its own handler as well as the backdrop's. Without one it
            relied on the click bubbling to the parent, which worked by luck
            and left a button that did nothing when reached by keyboard.
          */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-xl text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </figure>
  );
}
