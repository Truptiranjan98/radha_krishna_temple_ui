import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  FALLBACK_TEMPLE_INFO,
  darshanStatus,
  to12Hour,
  CATEGORY_META,
} from '../lib/temple';
import MoonDisc from '../components/MoonDisc';
import TeamSection from '../components/TeamSection';
import PeacockFeather from '../components/PeacockFeather';
import heroWebp from '../assets/temple-hero.webp';
import heroJpg from '../assets/temple-hero.jpg';

export default function Home() {
  const [info, setInfo] = useState(FALLBACK_TEMPLE_INFO);
  const [announcements, setAnnouncements] = useState([]);
  const [panchang, setPanchang] = useState(null);
  const [now, setNow] = useState(new Date());

  // The "open now" pill would otherwise go stale on a tab left open all day.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Each of these degrades on its own: the schedule falls back to the
    // bundled copy, the other two simply do not render.
    api.templeInfoCached().then(setInfo).catch(() => {});
    api.announcements().then(setAnnouncements).catch(() => setAnnouncements([]));
    api.panchangToday().then(setPanchang).catch(() => setPanchang(null));
  }, []);

  const status = darshanStatus(info.timings, now);

  return (
    <div className="mx-auto max-w-5xl">
      <Hero info={info} status={status} panchang={panchang} />

      {/*
        Order matters here and is deliberate. The single most common reason a
        devotee opens this page is "is the temple open, and when is the next
        arati" — so the timings sit directly under the hero, above the notice
        board, on every screen size. This is one column stack on mobile and the
        same order on desktop, so the phone and the laptop agree.
      */}
      <Timings info={info} status={status} now={now} />

      {announcements.length > 0 && (
        <section className="mt-12">
          <div className="section-head">
            <p className="eyebrow">From the temple</p>
            <h2 className="mt-1 text-2xl sm:text-3xl">Notices</h2>
          </div>

          <ul className="mt-5 flex flex-col gap-3">
            {announcements.map((a, i) => (
              <AnnouncementItem key={a.id} announcement={a} index={i} />
            ))}
          </ul>
        </section>
      )}

      <PujaCallout />

      <TeamSection />

      {panchang && <TodayPanchang panchang={panchang} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Hero({ info, status, panchang }) {
  return (
    <section className="relative grid gap-6 sm:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] sm:items-center">
      <AmbientFeathers />

      {/* The torana arch is already this app's motif; the dome sits at the top
          of the photograph, so the crop and the motif agree. */}
      <figure className="arch relative z-10 overflow-hidden border border-hairline bg-night-950">
        <picture>
          <source srcSet={heroWebp} type="image/webp" />
          <img
            src={heroJpg}
            alt="Sri Sri Radha Krishna Temple on a monsoon morning"
            className="aspect-[3/4] w-full object-cover sm:aspect-[5/7]"
            loading="eager"
          />
        </picture>
      </figure>

      <div className="relative z-10">
        <p className="eyebrow">Sri Sri</p>
        <h1 className="mt-1 text-4xl leading-[1.1] sm:text-5xl">
          Radha Krishna
          <span className="block">Temple</span>
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <StatusPill status={status} />
          {panchang && (
            <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-paper-raised px-3 py-1.5 text-sm">
              <MoonDisc tithiNumber={panchang.tithiNumber} size={16} />
              <span className="font-semibold">{panchang.tithi}</span>
              <span className="text-muted">{panchang.paksha}</span>
            </span>
          )}
        </div>

        {/*
          Reads the hours the page actually fetched, not the bundled fallback.
          These agreed on day one and quietly stopped agreeing the moment the
          server's schedule changed — the timeline below updated and this
          sentence did not.
        */}
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
          Darshan in the morning from {to12Hour(info.opensAt)} and again in the evening until{' '}
          {to12Hour(info.closesAt)}. Aratis, pujas and festival days are listed below.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/puja" className="btn btn-peacock">
            Book a puja
          </Link>
          <Link to="/calendar" className="btn btn-quiet">
            Open the calendar
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
        status.open ? 'bg-peacock-300/60 text-night-900' : 'bg-night-900 text-white'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${status.open ? 'bg-peacock-600' : 'bg-white/50'}`}
        aria-hidden="true"
      />
      {status.open
        ? `Open now until ${status.until}`
        : status.reopensTomorrow
          ? `Closed — opens ${status.until} tomorrow`
          : `Closed — opens ${status.until}`}
    </span>
  );
}

/* ------------------------------------------------------------------ */

function AnnouncementItem({ announcement, index = 0 }) {
  const meta = CATEGORY_META[announcement.category] ?? CATEGORY_META.GENERAL;

  return (
    <li
      className={`card card-lift reveal p-4 ${
        announcement.pinned ? 'border-marigold-500/50' : ''
      }`}
      style={{ '--i': index }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold tracking-wide ${meta.className}`}>
          {meta.label}
        </span>
        {announcement.pinned && (
          <span className="text-[0.68rem] font-bold tracking-wide text-muted">PINNED</span>
        )}
        {announcement.eventDate && (
          <span className="text-[0.72rem] font-semibold text-muted">
            {formatEventDate(announcement.eventDate)}
            {announcement.eventTime ? ` · ${to12Hour(announcement.eventTime.slice(0, 5))}` : ''}
          </span>
        )}
      </div>

      <h3 className="mt-2 text-lg leading-snug">{announcement.title}</h3>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted">
        {announcement.body}
      </p>
    </li>
  );
}

function formatEventDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */

function Timings({ info, status, now }) {
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  return (
    <section id="timings" className="mt-12 scroll-mt-6">
      <div className="section-head">
        <p className="eyebrow">Every day</p>
        <h2 className="mt-1 text-2xl sm:text-3xl">Darshan timings</h2>
      </div>

      <ol className="card mt-5 border-l border-hairline p-5 pl-6">
        {info.timings.map((t) => {
          const [h, m] = t.time.split(':').map(Number);
          const past = h * 60 + m <= minutesNow;
          const isNext = status.next?.time === t.time;

          return (
            <li key={t.time} className="relative flex gap-4 pb-5 pl-5 last:pb-0">
              {/* Marker sits on the rule, filled once the moment has passed. */}
              <span
                className={`absolute left-0 top-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 ${
                  isNext
                    ? 'border-peacock-600 bg-peacock-600'
                    : past
                      ? 'border-night-900 bg-night-900'
                      : 'border-hairline bg-paper-raised'
                }`}
                aria-hidden="true"
              />
              <time
                className={`w-20 shrink-0 text-sm font-bold tabular-nums ${
                  isNext ? 'text-peacock-600' : past ? 'text-night-900' : 'text-muted'
                }`}
                dateTime={t.time}
              >
                {to12Hour(t.time)}
              </time>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-semibold ${t.ritual ? '' : 'text-night-800'}`}>
                    {t.name}
                  </span>
                  {isNext && (
                    <span className="rounded-full bg-peacock-600/10 px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-peacock-600">
                      NEXT
                    </span>
                  )}
                </div>
                {t.detail && <p className="mt-0.5 text-sm text-muted">{t.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function TodayPanchang({ panchang }) {
  const facts = [
    ['Odia month', panchang.odiaMonth],
    ['Paksha', panchang.paksha],
    ['Nakshatra', panchang.nakshatra],
    ['Sunrise', to12Hour(panchang.sunrise)],
    ['Sunset', to12Hour(panchang.sunset)],
  ];

  return (
    <section className="mt-12">
      <div className="section-head">
        <p className="eyebrow">Panjika</p>
        <h2 className="mt-1 text-2xl sm:text-3xl">Today</h2>
      </div>

      <div className="card mt-4 p-5">
        <div className="flex items-center gap-4">
          <MoonDisc tithiNumber={panchang.tithiNumber} size={44} />
          <div className="min-w-0">
            <div className="text-2xl">
              {panchang.tithi}
              {panchang.tithiNumber !== 15 && panchang.tithiNumber !== 30 && (
                <span className="ml-2 text-base text-muted">{panchang.paksha}</span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted">
              Runs until {to12Hour(panchang.tithiEndsAt.split(' ')[1])} on{' '}
              {formatEventDate(panchang.tithiEndsAt.split(' ')[0])}
            </p>
          </div>
        </div>

        {panchang.festivals.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {panchang.festivals.map((f) => (
              <li
                key={f}
                className="rounded-full bg-rose-temple/10 px-3 py-1 text-sm font-semibold text-rose-temple"
              >
                {f}
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-hairline pt-4 sm:grid-cols-5">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="eyebrow">{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Link to="/calendar" className="btn btn-quiet mt-4">
        See the whole month
      </Link>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/**
 * A very quiet version of the intro animation, drifting behind the hero.
 * Purely decorative: aria-hidden, pointer-events none, and hidden outright
 * under prefers-reduced-motion (see .ambient in index.css).
 */
function AmbientFeathers() {
  const feathers = [
    { left: '4%', size: 130, drift: '6vw', spin: '14deg', dur: 26, delay: 0 },
    { left: '58%', size: 90, drift: '-5vw', spin: '-12deg', dur: 32, delay: 6 },
    { left: '84%', size: 150, drift: '4vw', spin: '10deg', dur: 29, delay: 12 },
  ];
  return (
    <div className="ambient" aria-hidden="true">
      {feathers.map((f, i) => (
        <PeacockFeather
          key={i}
          className="ambient-feather"
          style={{
            left: f.left,
            width: f.size,
            '--drift': f.drift,
            '--spin': f.spin,
            animationDuration: `${f.dur}s`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Front-page invitation to the booking form. */
function PujaCallout() {
  return (
    <section className="panel-night mt-12 p-6 sm:p-8">
      <PeacockFeather className="pointer-events-none absolute -right-6 -top-10 w-44 opacity-20" />
      <div className="relative max-w-lg">
        <p className="eyebrow !text-peacock-300">Seva</p>
        <h2 className="mt-2 text-2xl text-white sm:text-3xl">
          Puja at the temple, or at your home
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Satyanarayana Puja, abhisheka, annaprasana, griha pravesha, havan. Tell us what
          you need and the temple office will call you back to fix the day and the timing.
          No account needed.
        </p>
        <Link to="/puja" className="btn btn-marigold mt-5">
          Book a puja
        </Link>
      </div>
    </section>
  );
}
