import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import AuthedImage from '../components/AuthedImage';
import { RoleBadge, useToast } from '../components/Bits';

const CAN = {
  ADMIN: [
    'Post photographs to the temple gallery',
    'Add founders, co-founders and committee members',
    'Publish and pin notices on the front page',
    'Answer puja and home-puja bookings',
    'Delete any photo in the gallery',
  ],
  PRIEST: ['View the temple gallery'],
  DEVOTEE: ['View the temple gallery'],
};

export default function Profile() {
  const { user, signOut, avatarUrl, reloadAccount } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [picking, setPicking] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    try {
      const page = await api.myPhotos(0, 24);
      setCandidates(page?.content || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoadingCandidates(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (picking) loadCandidates();
  }, [picking, loadCandidates]);

  if (!user) return null;

  // The chosen portrait first, a Google picture second, the initial last.
  const picture = avatarUrl || user.pictureUrl;

  const choose = async (photoId) => {
    setSaving(true);
    try {
      await api.setAsProfilePhoto(photoId);
      await reloadAccount();
      setPicking(false);
      toast('Portrait updated');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="section-head">
        <p className="eyebrow">Your account</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Profile</h1>
      </div>

      <div className="card mt-6 p-5">
        <div className="flex items-center gap-4">
          {picture ? (
            <img
              src={picture}
              alt=""
              className="h-16 w-16 rounded-full object-cover ring-2 ring-peacock-300 ring-offset-2 ring-offset-paper-raised"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-night-900 text-xl font-bold text-white">
              {user.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">{user.name}</div>
            <div className="truncate text-sm text-muted">{user.email}</div>
            <div className="mt-1.5">
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>

        {user.role === 'ADMIN' && (
          <div className="mt-4 rounded-lg bg-paper px-3 py-2.5">
            <p className="text-xs leading-relaxed text-muted">
              {user.profilePhotoId ? (
                <>
                  Your portrait stays put. Uploading photographs to the gallery — including
                  founders, co-founders and committee members — never replaces it. It changes
                  only when you pick a new one here, or upload under the “Admin” category.
                </>
              ) : (
                <>
                  You haven’t set a portrait yet. Pick one of your photographs below, or{' '}
                  <Link
                    to="/upload"
                    className="font-semibold text-peacock-600 underline underline-offset-2"
                  >
                    upload one
                  </Link>{' '}
                  under the “Admin” category.
                </>
              )}
            </p>

            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-quiet !py-2 !text-xs"
                onClick={() => setPicking((v) => !v)}
              >
                {picking ? 'Cancel' : user.profilePhotoId ? 'Change portrait' : 'Choose a portrait'}
              </button>
              <Link to="/upload" className="btn btn-quiet !py-2 !text-xs">
                Upload a new one
              </Link>
            </div>
          </div>
        )}

        {picking && (
          <div className="mt-4 border-t border-hairline pt-4">
            <p className="eyebrow">Pick from your photographs</p>
            {loadingCandidates ? (
              <p className="mt-3 text-sm text-muted">Loading…</p>
            ) : candidates.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                You haven’t uploaded anything yet.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {candidates.map((p) => {
                  const current = p.id === user.profilePhotoId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={saving || current}
                      onClick={() => choose(p.id)}
                      aria-label={`Use ${p.personName || p.caption || p.originalFileName} as your portrait`}
                      className={`overflow-hidden rounded-lg border-2 transition-colors disabled:opacity-60 ${
                        current ? 'border-peacock-600' : 'border-transparent hover:border-hairline'
                      }`}
                    >
                      <AuthedImage
                        photoId={p.id}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-hairline pt-4 text-sm">
          <div>
            <dt className="eyebrow">Signed in with</dt>
            <dd className="mt-1">{user.provider === 'GOOGLE' ? 'Google' : 'Email'}</dd>
          </div>
          <div>
            <dt className="eyebrow">Member since</dt>
            <dd className="mt-1">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="card mt-4 p-5">
        <h2 className="text-lg">What you can do</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {(CAN[user.role] || []).map((line) => (
            <li key={line} className="flex gap-2.5 text-sm">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-peacock-500" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <button
        className="btn btn-quiet mt-4 w-full"
        onClick={() => {
          signOut();
          navigate('/signin', { replace: true });
        }}
      >
        Sign out
      </button>
    </div>
  );
}
