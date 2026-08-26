import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { FeatherMark, OmMark, useToast } from '../components/Bits';
import PeacockFeather from '../components/PeacockFeather';

/**
 * Temple admin sign-in.
 *
 * Priest and devotee self sign-up has been removed: the temple runs on a
 * single admin account that posts the photographs and the notices, and
 * everything a visitor needs — timings, calendar, gallery, puja booking — is
 * open without an account. The register form is gone from here, and
 * `AuthService.register` refuses the request server-side too, because hiding
 * a form does not close a public endpoint.
 */
export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFieldErrors({});
    try {
      await signIn(form.email.trim(), form.password);
      // Admins land on the same front page as everyone else — the extra
      // Notices / Bookings / Manage tabs simply appear in the nav.
      navigate('/', { replace: true });
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Left: the thesis. Deep night sky, the feather, the invitation. */}
      <div className="relative hidden overflow-hidden bg-night-900 px-12 py-16 lg:flex lg:flex-col lg:justify-between">
        <div className="rail-h absolute inset-x-0 top-0 h-1" aria-hidden="true" />
        <PeacockFeather className="pointer-events-none absolute -right-10 top-24 w-72 opacity-[0.18]" />
        <PeacockFeather className="pointer-events-none absolute -left-16 bottom-0 w-56 opacity-[0.10]" />

        <div className="relative flex items-center gap-2.5">
          <FeatherMark className="h-8 w-8" />
          <span className="font-display text-xl text-white">RadhaKrishna</span>
        </div>

        <div className="relative max-w-md">
          <OmMark className="mb-5 text-6xl" />
          <p className="eyebrow !text-peacock-300">Temple administration</p>
          <h1 className="mt-4 text-5xl leading-[1.1] text-white">
            Keep the temple
            <br />
            up to date.
          </h1>
          <p className="mt-5 text-[0.95rem] leading-relaxed text-white/65">
            Post photographs to the gallery, publish notices for the front page and answer
            puja bookings. Devotees see all of it without signing in.
          </p>
        </div>

        <p className="relative text-xs text-white/35">Administrator access only</p>
      </div>

      {/* Right: the form */}
      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <FeatherMark className="h-8 w-8" />
            <span className="font-display text-xl">RadhaKrishna</span>
          </div>

          <h2 className="text-3xl">Admin sign in</h2>
          <p className="mt-2 text-sm text-muted">
            For the temple office. Devotees do not need an account.
          </p>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-3.5">
            <div>
              <label className="eyebrow" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                className="field mt-1.5"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-temple">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="eyebrow" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="field mt-1.5"
                value={form.password}
                onChange={set('password')}
                autoComplete="current-password"
                required
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-temple">{fieldErrors.password}</p>
              )}
            </div>

            <button type="submit" className="btn btn-peacock mt-2 w-full" disabled={busy}>
              {busy ? 'One moment…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Just visiting?{' '}
            <Link
              to="/"
              className="font-semibold text-peacock-600 underline underline-offset-2"
            >
              Go to the temple page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
