import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { EmptyState, Spinner, ConfirmDialog, useToast } from '../components/Bits';

/**
 * The office's list of puja requests.
 *
 * This exists because the notification email is best-effort — if SMTP is
 * unconfigured or Gmail rejects the send, the booking is still committed and
 * still shows up here. The list is the record; the email is a convenience.
 */
export default function AdminBookings() {
  const [bookings, setBookings] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [filter, setFilter] = useState('pending');
  const toast = useToast();

  const load = () =>
    api
      .adminPujaBookings()
      .then(setBookings)
      .catch((e) => {
        toast(e.message, 'error');
        setBookings([]);
      });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleContacted = async (b) => {
    try {
      const updated = await api.setBookingContacted(b.id, !b.contacted);
      setBookings((list) => list.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = async () => {
    const id = confirming.id;
    setConfirming(null);
    try {
      await api.deleteBooking(id);
      setBookings((list) => list.filter((x) => x.id !== id));
      toast('Booking removed');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (!bookings) return <Spinner label="Loading bookings" />;

  const pending = bookings.filter((b) => !b.contacted);
  const shown = filter === 'pending' ? pending : bookings;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="section-head">
        <p className="eyebrow">Temple office</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Puja bookings</h1>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[
          ['pending', `To call back (${pending.length})`],
          ['all', `All (${bookings.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`btn ${filter === key ? 'btn-primary' : 'btn-quiet'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={filter === 'pending' ? 'Nobody waiting' : 'No bookings yet'}
          body={
            filter === 'pending'
              ? 'Every request has been called back.'
              : 'Requests made from the Book a puja page will appear here.'
          }
        />
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {shown.map((b, i) => (
            <li
              key={b.id}
              className={`card reveal p-4 ${b.contacted ? 'opacity-65' : ''}`}
              style={{ '--i': i }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold tracking-wide ${
                    b.atHome
                      ? 'bg-marigold-500/15 text-[#8a5a0f]'
                      : 'bg-peacock-600/10 text-peacock-600'
                  }`}
                >
                  {b.atHome ? 'AT HOME' : 'AT TEMPLE'}
                </span>
                <span className="font-semibold">{b.pujaLabel}</span>
                <span className="ml-auto text-xs tabular-nums text-muted">#{b.id}</span>
              </div>

              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <div className="eyebrow">Devotee</div>
                  <div className="mt-0.5 font-semibold">{b.name}</div>
                  <a
                    href={`tel:${b.phone}`}
                    className="text-peacock-600 underline underline-offset-2"
                  >
                    {b.phone}
                  </a>
                  {b.email && <div className="truncate text-muted">{b.email}</div>}
                </div>
                <div>
                  <div className="eyebrow">Preferred date</div>
                  <div className="mt-0.5">
                    {b.preferredDate
                      ? new Date(`${b.preferredDate}T00:00:00`).toLocaleDateString(undefined, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'No date given — advise them'}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm">
                <div className="eyebrow">Address</div>
                <p className="mt-0.5 whitespace-pre-line text-muted">{b.address}</p>
              </div>

              {b.notes && (
                <div className="mt-3 text-sm">
                  <div className="eyebrow">Notes</div>
                  <p className="mt-0.5 whitespace-pre-line text-muted">{b.notes}</p>
                </div>
              )}

              {!b.notified && (
                <p className="mt-3 rounded-lg bg-marigold-500/10 px-3 py-2 text-xs text-[#8a5a0f]">
                  No notification email was sent for this one — SMTP was not configured
                  when it arrived. The booking itself is safe.
                </p>
              )}

              <div className="mt-4 flex gap-2 border-t border-hairline pt-3">
                <button
                  className={`btn flex-1 ${b.contacted ? 'btn-quiet' : 'btn-peacock'}`}
                  onClick={() => toggleContacted(b)}
                >
                  {b.contacted ? 'Mark as not called' : 'Mark as called back'}
                </button>
                <button
                  className="btn btn-quiet text-rose-temple"
                  onClick={() => setConfirming(b)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Delete this booking?"
        body={
          confirming
            ? `${confirming.name}'s request for ${confirming.pujaLabel} will be removed permanently.`
            : ''
        }
        onConfirm={remove}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
