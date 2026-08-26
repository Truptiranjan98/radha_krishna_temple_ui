/**
 * Darshan schedule.
 *
 * The backend is the source of truth (TempleScheduleService), but the front
 * page should never show a blank schedule because an API call was slow or the
 * server is down — the hours are fixed, so we ship them with the bundle and let
 * the fetch overwrite them when it lands.
 *
 * Change the hours in TempleScheduleService.java; this copy exists only so the
 * page has something correct to paint immediately.
 */
export const FALLBACK_TEMPLE_INFO = {
  name: 'Shri Shri Radhakrishna Temple',
  /*
   * Where the temple is and how to reach it.
   *
   * The server sends this with the timings (TempleScheduleService.contact) and
   * that copy wins. This one exists for the same reason the hours do: the
   * footer should paint something correct immediately, and a visitor standing
   * outside looking for the gate is the last person who should be shown a
   * blank map while a fetch retries. Coordinates come from the temple's own
   * Google Maps pin.
   */
  contact: {
    whatsappNumber: '9337797478',
    whatsappUrl: 'https://wa.me/919337797478',
    phoneNumber: '9337797478',
    address: 'Shri Shri Radhakrishna Temple, Balasore, Odisha',
    latitude: 21.3564127,
    longitude: 86.7710678,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=21.3564127,86.7710678',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=21.3564127,86.7710678',
  },
  opensAt: '05:30',
  closesAt: '20:00',
  morningSession: '05:30 - 12:00',
  eveningSession: '16:00 - 20:00',
  timings: [
    { time: '05:30', name: 'Dwara Phita', detail: 'Temple doors open for the day', ritual: false },
    { time: '06:30', name: 'Sakala Arati', detail: 'Morning arati before the deities', ritual: true },
    {
      time: '07:00',
      name: 'Puja Arambha',
      detail: 'Daily puja begins; darshan continues through the morning',
      ritual: true,
    },
    { time: '12:00', name: 'Madhyahna Bandha', detail: 'Temple closes for the afternoon', ritual: false },
    // PLACEHOLDER, same as AFTERNOON_REOPEN in TempleScheduleService.java.
    // The temple's real reopening hour was never specified — change both.
    { time: '16:00', name: 'Sandhya Dwara Phita', detail: 'Temple reopens for evening darshan', ritual: false },
    { time: '19:15', name: 'Sandhya Arati', detail: 'Evening arati', ritual: true },
    { time: '20:00', name: 'Dwara Bandha', detail: 'Temple closes for the night', ritual: false },
  ],
};

/** "07:15" -> minutes since midnight. */
export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** "19:15" -> "7:15 PM". Temple notices read better in 12-hour form. */
export function to12Hour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/**
 * Is the temple open at `now`, and what happens next?
 *
 * The schedule is a flat list of events, so we derive the open windows by
 * walking it: an "open" event starts a window, a "close" event ends one. That
 * keeps this in step with the backend list automatically — add a third session
 * there and this needs no change.
 */
export function darshanStatus(timings, now = new Date()) {
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const opens = timings.filter((t) => /Phita/i.test(t.name)).map((t) => toMinutes(t.time));
  const closes = timings.filter((t) => /Bandha/i.test(t.name)).map((t) => toMinutes(t.time));

  const windows = opens
    .map((open) => {
      const close = closes.find((c) => c > open);
      return close === undefined ? null : { open, close };
    })
    .filter(Boolean);

  const current = windows.find((w) => minutesNow >= w.open && minutesNow < w.close);

  if (current) {
    return {
      open: true,
      until: minutesToLabel(current.close),
      next: nextEvent(timings, minutesNow),
    };
  }

  const upcoming = windows.find((w) => w.open > minutesNow);
  return {
    open: false,
    // After the last close of the day the next opening is tomorrow morning.
    until: minutesToLabel(upcoming ? upcoming.open : windows[0]?.open ?? 0),
    reopensTomorrow: !upcoming,
    next: nextEvent(timings, minutesNow),
  };
}

function nextEvent(timings, minutesNow) {
  return timings.find((t) => toMinutes(t.time) > minutesNow) ?? null;
}

function minutesToLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return to12Hour(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
}

/** Category -> how an announcement is labelled and coloured. */
export const CATEGORY_META = {
  PUJA: { label: 'Puja', className: 'bg-marigold-500/15 text-[#8a5a0f]' },
  FESTIVAL: { label: 'Festival', className: 'bg-rose-temple/10 text-rose-temple' },
  TIMING: { label: 'Timing', className: 'bg-peacock-600/10 text-peacock-600' },
  GENERAL: { label: 'Notice', className: 'bg-night-900/8 text-night-800' },
  URGENT: { label: 'Urgent', className: 'bg-rose-temple text-white' },
};

export const CATEGORY_ORDER = ['PUJA', 'FESTIVAL', 'TIMING', 'GENERAL', 'URGENT'];
