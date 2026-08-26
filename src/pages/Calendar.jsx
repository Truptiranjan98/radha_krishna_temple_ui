import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Spinner, useToast } from '../components/Bits';
import MoonDisc from '../components/MoonDisc';
import { to12Hour } from '../lib/temple';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Calendar() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [days, setDays] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.panchangMonth(cursor.year, cursor.month);
      setDays(data);
      // Keep the detail panel on the same calendar date when paging months.
      setSelected((prev) => data.find((d) => d.date === prev?.date) ?? null);
    } catch (err) {
      toast(err.message, 'error');
      setDays([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.year, cursor.month]);

  useEffect(() => {
    load();
  }, [load]);

  // Open on today the first time the current month loads.
  useEffect(() => {
    if (!days || selected) return;
    const iso = toIso(today);
    const match = days.find((d) => d.date === iso);
    if (match) setSelected(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const shift = (delta) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };

  const leadingBlanks = days?.length
    ? new Date(`${days[0].date}T00:00:00`).getDay()
    : 0;

  // The Odia solar month runs mid-month to mid-month, so a civil month almost
  // always straddles two of them. Naming both is more honest than picking one.
  const odiaMonths = days?.length ? [...new Set(days.map((d) => d.odiaMonth))] : [];
  // Don't name the leap month here: under purnimanta naming its dark and
  // bright fortnights carry different names, so any single label misleads.
  const hasAdhika = Boolean(days?.some((d) => d.adhikaMasa));

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">Odia panjika</p>
      <h1 className="mt-1 text-3xl sm:text-4xl">Temple calendar</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Tithi, nakshatra and festival days, calculated for the temple&apos;s own sunrise. Each day
        shows the moon as it actually stands that morning.
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button className="btn btn-quiet !px-3" onClick={() => shift(-1)} aria-label="Previous month">
          <Chevron dir="left" />
        </button>

        <div className="text-center">
          <div className="font-display text-xl">
            {MONTH_NAMES[cursor.month - 1]} {cursor.year}
          </div>
          {odiaMonths.length > 0 && (
            <div className="eyebrow mt-0.5">{odiaMonths.join(' · ')}</div>
          )}
          {hasAdhika && (
            <div className="mt-1 text-[0.68rem] font-semibold text-muted">
              Includes an adhika masa — festivals fall in the true month
            </div>
          )}
        </div>

        <button className="btn btn-quiet !px-3" onClick={() => shift(1)} aria-label="Next month">
          <Chevron dir="right" />
        </button>
      </div>

      {loading && !days ? (
        <Spinner label="Casting the panchang" />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-1.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="pb-1 text-center text-[0.62rem] font-bold tracking-wide text-muted">
                <span className="sm:hidden">{w[0]}</span>
                <span className="hidden sm:inline">{w.toUpperCase()}</span>
              </div>
            ))}

            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} aria-hidden="true" />
            ))}

            {days?.map((d) => (
              <DayCell
                key={d.date}
                day={d}
                isToday={d.date === toIso(today)}
                isSelected={selected?.date === d.date}
                onSelect={() => setSelected(d)}
              />
            ))}
          </div>

          <Legend />

          {selected && <DayDetail day={selected} />}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DayCell({ day, isToday, isSelected, onSelect }) {
  const marked = day.purnima || day.amabasya;
  const hasFestival = day.festivals.length > 0;

  return (
    <button
      onClick={onSelect}
      aria-current={isToday ? 'date' : undefined}
      aria-pressed={isSelected}
      className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border p-0.5 text-center transition-colors
        ${isSelected ? 'border-peacock-600 bg-peacock-600/8' : 'border-hairline bg-paper-raised hover:bg-paper'}
        ${isToday && !isSelected ? 'border-night-900' : ''}`}
    >
      <span
        className={`text-xs font-bold leading-none tabular-nums sm:text-sm ${
          isToday ? 'text-peacock-600' : ''
        }`}
      >
        {Number(day.date.slice(-2))}
      </span>

      <MoonDisc tithiNumber={day.tithiNumber} size={16} className="shrink-0" />

      {/* Full tithi name only where there is room; the moon carries it on phones. */}
      <span
        className={`hidden max-w-full truncate px-0.5 text-[0.58rem] leading-tight sm:block ${
          marked ? 'font-bold' : 'text-muted'
        }`}
      >
        {marked ? day.tithi : shortTithi(day.tithi)}
      </span>

      <span className="flex h-1.5 items-center gap-0.5" aria-hidden="true">
        {hasFestival && <span className="h-1.5 w-1.5 rounded-full bg-rose-temple" />}
        {day.ekadasi && <span className="h-1.5 w-1.5 rounded-full bg-peacock-500" />}
      </span>
    </button>
  );
}

function shortTithi(tithi) {
  return tithi.length > 7 ? `${tithi.slice(0, 6)}.` : tithi;
}

function Legend() {
  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
      <li className="flex items-center gap-1.5">
        <MoonDisc tithiNumber={15} size={14} /> Purnima
      </li>
      <li className="flex items-center gap-1.5">
        <MoonDisc tithiNumber={30} size={14} /> Amabasya
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-temple" /> Festival
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-peacock-500" /> Ekadasi
      </li>
    </ul>
  );
}

/* ------------------------------------------------------------------ */

function DayDetail({ day }) {
  const date = new Date(`${day.date}T00:00:00`);
  const [endDate, endTime] = day.tithiEndsAt.split(' ');

  const facts = [
    ['Odia month', day.odiaMonth],
    ['Lunar month', day.lunarMonth],
    ['Paksha', day.paksha],
    ['Nakshatra', day.nakshatra],
    ['Sunrise', to12Hour(day.sunrise)],
    ['Sunset', to12Hour(day.sunset)],
  ];

  return (
    <section className="card mt-5 p-5">
      <div className="flex items-start gap-4">
        <MoonDisc tithiNumber={day.tithiNumber} size={40} className="mt-1 shrink-0" />
        <div className="min-w-0">
          <p className="eyebrow">
            {date.toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <h2 className="mt-1 text-2xl">
            {day.tithi}
            {!day.purnima && !day.amabasya && (
              <span className="ml-2 text-base text-muted">{day.paksha} paksha</span>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Ends {to12Hour(endTime)}
            {endDate !== day.date ? ' the next day' : ''}
          </p>
        </div>
      </div>

      {day.festivals.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {day.festivals.map((f) => (
            <li
              key={f}
              className="rounded-full bg-rose-temple/10 px-3 py-1 text-sm font-semibold text-rose-temple"
            >
              {f}
            </li>
          ))}
        </ul>
      )}

      {day.adhikaMasa && (
        <p className="mt-4 rounded-lg bg-night-900/5 px-3 py-2 text-sm text-muted">
          This lunation is an adhika masa, an extra month inserted to keep the lunar and solar
          years together. Festivals are kept for the true month that follows.
        </p>
      )}

      {day.ekadasi && day.festivals.length === 0 && (
        <p className="mt-4 inline-block rounded-full bg-peacock-600/10 px-3 py-1 text-sm font-semibold text-peacock-600">
          Ekadasi — special bhoga after the morning puja
        </p>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-hairline pt-4 sm:grid-cols-5">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="eyebrow">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      {dir === 'left' ? (
        <path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6 4.6-4.6Z" />
      ) : (
        <path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6-4.6 4.6Z" />
      )}
    </svg>
  );
}

function toIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}
