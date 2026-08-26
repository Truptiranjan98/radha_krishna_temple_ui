import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import PhotoCard from '../components/PhotoCard';
import EditPhotoDialog from '../components/EditPhotoDialog';
import { Spinner, EmptyState, ConfirmDialog, useToast } from '../components/Bits';
import { GALLERY_FILTERS } from '../lib/photoCategories';

/**
 * Shared by the full gallery and "My photos" — same grid, different source.
 */
export default function Gallery({ mine = false }) {
  const { user, isAdmin, reloadAccount } = useAuth();
  const toast = useToast();

  const [page, setPage] = useState(0);
  const [category, setCategory] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = mine
        ? await api.myPhotos(page, 20, category)
        : await api.gallery(page, 20, category);
      setData(res);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
    // toast identity is stable enough; refetch only on page/source/filter change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, mine, category]);

  useEffect(() => {
    load();
  }, [load]);

  /*
   * Reset to the first page when the source or the filter changes.
   *
   * This has to happen in the same update that changes them, not in an effect
   * afterwards — an effect fires after `load` has already run once against the
   * new source with the old page number, which meant switching to a filter
   * while on page 3 fetched a page 3 that usually did not exist, painted an
   * empty grid, then fetched again. The handlers below set both at once.
   */
  const changeCategory = (next) => {
    setCategory(next);
    setPage(0);
  };

  useEffect(() => {
    setCategory(null);
    setPage(0);
  }, [mine]);

  const canModify = (photo) => isAdmin || photo.ownerId === user?.id;

  const confirmDelete = async () => {
    const photo = deleting;
    setDeleting(null);
    try {
      // Admins deleting someone else's photo go through the admin route;
      // the owner route would reject them for photos they don't own.
      if (photo.ownerId === user?.id) await api.deletePhoto(photo.id);
      else await api.adminDeletePhoto(photo.id);
      toast('Photo deleted');

      // Deleting your own portrait releases it server-side; re-read the
      // account so the header falls back to the initial straight away
      // instead of showing an image URL that now 404s.
      if (photo.ownerId === user?.id && photo.id === user?.profilePhotoId) {
        await reloadAccount().catch(() => {});
      }
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const photos = data?.content || [];
  const filterLabel = GALLERY_FILTERS.find((f) => f.value === category)?.label;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-end justify-between gap-4">
        <div className="section-head">
          <p className="eyebrow">{mine ? 'Your uploads' : 'The collection'}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">{mine ? 'My photos' : 'Gallery'}</h1>
        </div>
        {data && data.totalElements > 0 && (
          <p className="pb-1.5 text-sm text-muted">
            {data.totalElements} {data.totalElements === 1 ? 'photo' : 'photos'}
          </p>
        )}
      </div>

      {/* Category filter. Horizontally scrollable so it never wraps into two
          rows on a phone and pushes the grid down. */}
      <div className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2">
          {GALLERY_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => changeCategory(f.value)}
              aria-pressed={category === f.value}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                category === f.value
                  ? 'border-peacock-600 bg-peacock-600 text-white'
                  : 'border-hairline bg-paper-raised text-night-900 hover:bg-paper'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <Spinner label="Opening the gallery" />
      ) : photos.length === 0 ? (
        <EmptyState
          title={
            category
              ? `No ${filterLabel?.toLowerCase()} photographs yet`
              : mine
                ? 'You haven’t added a photo yet'
                : 'The gallery is empty'
          }
          body={
            category
              ? 'Try another category, or upload one.'
              : mine
                ? 'Photos you upload will appear here, and in the temple gallery for everyone to see.'
                : 'The temple has not posted any photographs yet. Please look again soon.'
          }
          /* Only the admin uploads now, so a visitor is never shown a
             call to action they cannot act on. */
          action={
            isAdmin ? (
              <Link to="/upload" className="btn btn-peacock mt-2">
                Upload a photo
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {photos.map((p) => (
              <PhotoCard
                key={p.id}
                photo={p}
                canModify={canModify(p)}
                isProfilePhoto={p.id === user?.profilePhotoId}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                className="btn btn-quiet"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {data.page + 1} of {data.totalPages}
              </span>
              <button
                className="btn btn-quiet"
                disabled={data.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <EditPhotoDialog
        photo={editing}
        onClose={() => setEditing(null)}
        onSaved={async (updated) => {
          // Captured before clearing: the portrait may have been handed over
          // (this photo just became ADMIN) or taken away (it was the portrait
          // and moved out of ADMIN). Either way the header has to hear about
          // it, or it keeps painting an image the account no longer points at.
          const wasPortrait = editing?.id === user?.profilePhotoId;
          setEditing(null);
          toast('Photo updated');
          if (updated?.category === 'ADMIN' || wasPortrait) {
            await reloadAccount().catch(() => {});
          }
          load();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this photo?"
        body="The image file is removed from the temple gallery. This can't be undone."
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
