import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useIntro } from '../lib/intro';
import { useToast } from '../components/Bits';
import PeacockFeather from '../components/PeacockFeather';

/**
 * Booking a puja, at the temple or at home.
 *
 * Open to everyone: asking the temple to perform a puja should not require an
 * account. The submission is stored server-side and the office is emailed;
 * see PujaBookingService.
 *
 * The puja list is fetched from `/api/public/puja-types` rather than hardcoded
 * here, so adding a puja is a one-line change to the `PujaType` enum.
 */

/** Used only until the fetch lands, so the form is never briefly empty. */
const FALLBACK_TYPES = [
  { value: 'SATYANARAYANA_PUJA', label: 'Satyanarayana Puja', atHome: false },
  { value: 'ABHISHEKA', label: 'Abhisheka', atHome: false },
  { value: 'ARCHANA', label: 'Archana / Sankalpa', atHome: false },
  { value: 'ANNAPRASANA', label: 'Annaprasana', atHome: false },
  { value: 'NAMAKARANA', label: 'Namakarana', atHome: false },
  { value: 'BHOGA_SEVA', label: 'Bhoga Seva sponsorship', atHome: false },
  { value: 'GRIHA_PRAVESHA', label: 'Griha Pravesha (home)', atHome: true },
  { value: 'HOME_SATYANARAYANA', label: 'Satyanarayana Puja at home', atHome: true },
  { value: 'HOME_HAVAN', label: 'Havan / Homa at home', atHome: true },
  { value: 'HOME_OTHER', label: 'Other home puja', atHome: true },
];

/** "+91 93377 97478" -> "9337797478". Mirrors PujaBookingService. */
function normalisePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  // Drop an Indian country code so the stored number is always the bare ten
  // digits, however the devotee chose to type it.
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  address: '',
  pujaType: '',
  preferredDate: '',
  notes: '',
};

export default function PujaBooking() {
  const [types, setTypes] = useState(FALLBACK_TYPES);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const toast = useToast();
  const playIntro = useIntro();

  useEffect(() => {
    api.pujaTypes().then(setTypes).catch(() => {});
  }, []);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [k]: undefined }));
  };

  const atTemple = useMemo(() => types.filter((t) => !t.atHome), [types]);
  const atHome = useMemo(() => types.filter((t) => t.atHome), [types]);
  const selected = types.find((t) => t.value === form.pujaType);
  const isHomePuja = Boolean(selected?.atHome);

  // The booking form should not let you pick yesterday.
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.pujaType) {
      setFieldErrors({ pujaType: 'Choose which puja you would like' });
      return;
    }
    setBusy(true);
    setFieldErrors({});
    try {
      const saved = await api.bookPuja({
        name: form.name.trim(),
        // Sent as bare digits. The server accepts spaces and dashes and
        // strips them anyway, but normalising here means what the devotee
        // typed can never be the reason the request bounces.
        phone: normalisePhone(form.phone),
        email: form.email.trim() || null,
        address: form.address.trim(),
        pujaType: form.pujaType,
        preferredDate: form.preferredDate || null,
        notes: form.notes.trim() || null,
      });
      // The curtain marks the moment and covers the swap from the form to the
      // confirmation, so it lifts on the finished screen rather than the page
      // visibly re-rendering underneath the devotee.
      playIntro({
        title: 'Your request has reached the temple',
        subtitle: `Booking #${saved.id}`,
      });
      setDone(saved);
      setForm(EMPTY);
      window.scrollTo({ top: 0 });
    } catch (err) {
      const errors = err.fieldErrors || {};
      setFieldErrors(errors);
      /*
       * A validation failure comes back as the message "Validation failed"
       * plus a map of per-field messages. Showing the generic line in the
       * toast told the devotee nothing — the useful sentence was the one
       * attached to the field. Surface that instead, and scroll it into view,
       * since the offending field is often above the fold of a long form.
       */
      const [firstField, firstMessage] = Object.entries(errors)[0] || [];
      toast(firstMessage || err.message, 'error');
      if (firstField) {
        document.getElementById(firstField)?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card relative overflow-hidden p-7 text-center">
          <PeacockFeather className="pointer-events-none absolute -right-8 -top-6 w-32 opacity-[0.09]" />
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-peacock-600/10">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-peacock-600" aria-hidden="true">
              <path d="M9.6 16.2 5.4 12l-1.4 1.4 5.6 5.6L20.4 8.2 19 6.8Z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl">Your request has reached the temple</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The temple office will call you on <strong>{done.phone}</strong> to confirm the
            date, the timing and what to bring.
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-hairline pt-4 text-left text-sm">
            <div>
              <dt className="eyebrow">Puja</dt>
              <dd className="mt-1 font-semibold">{done.pujaLabel}</dd>
            </div>
            <div>
              <dt className="eyebrow">Reference</dt>
              <dd className="mt-1 font-semibold tabular-nums">#{done.id}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              className="btn btn-quiet flex-1"
              onClick={() => {
                playIntro({ title: 'Book another puja', subtitle: 'Seva', hold: 1100 });
                setDone(null);
              }}
            >
              Book another
            </button>
            <Link to="/" className="btn btn-peacock flex-1">
              Back to the temple
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="section-head">
        <p className="eyebrow">Seva</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Book a puja</h1>
      </div>
      <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
        Request a puja at the temple, or invite the priests to perform one at your home.
        Leave your details below and the temple office will call you back to confirm the
        date, the timing and what to bring. There is no need to sign in.
      </p>

      <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
        {/* ---------------- which puja ---------------- */}
        <fieldset className="card p-5">
          <legend className="eyebrow px-1">Which puja</legend>

          <div className="mt-3 flex flex-col gap-4">
            <PujaGroup
              title="At the temple"
              options={atTemple}
              value={form.pujaType}
              onChange={(v) => {
                setForm((f) => ({ ...f, pujaType: v }));
                setFieldErrors((fe) => ({ ...fe, pujaType: undefined }));
              }}
            />
            <PujaGroup
              title="At your home"
              options={atHome}
              value={form.pujaType}
              onChange={(v) => {
                setForm((f) => ({ ...f, pujaType: v }));
                setFieldErrors((fe) => ({ ...fe, pujaType: undefined }));
              }}
            />
          </div>

          {fieldErrors.pujaType && (
            <p className="mt-3 text-xs text-rose-temple">{fieldErrors.pujaType}</p>
          )}
        </fieldset>

        {/* ---------------- your details ---------------- */}
        <fieldset className="card p-5">
          <legend className="eyebrow px-1">Your details</legend>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field
              id="name"
              label="Full name"
              value={form.name}
              onChange={set('name')}
              error={fieldErrors.name}
              autoComplete="name"
              required
            />
            <Field
              id="phone"
              label="Mobile number"
              value={form.phone}
              onChange={set('phone')}
              error={fieldErrors.phone}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="98765 43210"
              required
            />
          </div>

          <div className="mt-4">
            <Field
              id="email"
              label="Email"
              hint="Optional — we will send you an acknowledgement."
              value={form.email}
              onChange={set('email')}
              error={fieldErrors.email}
              type="email"
              inputMode="email"
              autoComplete="email"
            />
          </div>

          <div className="mt-4">
            <label className="eyebrow" htmlFor="address">
              {isHomePuja ? 'Address where the puja will be performed' : 'Your address'}
            </label>
            <textarea
              id="address"
              className="field mt-1.5 min-h-24 resize-y"
              value={form.address}
              onChange={set('address')}
              autoComplete="street-address"
              placeholder="House / flat, street, area, city, PIN"
              required
            />
            {isHomePuja && !fieldErrors.address && (
              <p className="mt-1 text-xs text-peacock-600">
                The priests will travel to this address — please include a landmark.
              </p>
            )}
            {fieldErrors.address && (
              <p className="mt-1 text-xs text-rose-temple">{fieldErrors.address}</p>
            )}
          </div>
        </fieldset>

        {/* ---------------- when ---------------- */}
        <fieldset className="card p-5">
          <legend className="eyebrow px-1">When</legend>

          <div className="mt-3">
            <Field
              id="preferredDate"
              label="Preferred date"
              hint="Leave blank and the office will suggest an auspicious day."
              value={form.preferredDate}
              onChange={set('preferredDate')}
              error={fieldErrors.preferredDate}
              type="date"
              min={minDate}
            />
          </div>

          <div className="mt-4">
            <label className="eyebrow" htmlFor="notes">
              Anything else
            </label>
            <textarea
              id="notes"
              className="field mt-1.5 min-h-20 resize-y"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Gotra, names for the sankalpa, number of people, preferred timing…"
            />
            {fieldErrors.notes && (
              <p className="mt-1 text-xs text-rose-temple">{fieldErrors.notes}</p>
            )}
          </div>
        </fieldset>

        <button type="submit" className="btn btn-peacock w-full" disabled={busy}>
          {busy ? 'Sending to the temple…' : 'Send booking request'}
        </button>

        <p className="pb-2 text-center text-xs text-muted">
          Your details go only to the temple office.
        </p>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PujaGroup({ title, options, value, onChange }) {
  if (options.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{title}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((t) => {
          const active = value === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              aria-pressed={active}
              className={`card-lift rounded-lg border px-3 py-3 text-left text-sm font-semibold transition-colors ${
                active
                  ? 'border-peacock-600 bg-peacock-600/8 text-peacock-600'
                  : 'border-hairline bg-paper-raised text-night-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                    active ? 'border-peacock-600' : 'border-hairline'
                  }`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-peacock-600" />}
                </span>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({ id, label, hint, error, ...props }) {
  return (
    <div>
      <label className="eyebrow" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="field mt-1.5" {...props} />
      {error ? (
        <p className="mt-1 text-xs text-rose-temple">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}
