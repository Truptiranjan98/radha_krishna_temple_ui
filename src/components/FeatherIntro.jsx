import { useEffect, useRef, useState } from 'react';
import PeacockFeather from './PeacockFeather';
import { Flute, Shankha, Chakra, Gada, Padma } from './DivineSymbols';

/**
 * The curtain: peacock feathers and the deity's own symbols — flute, conch,
 * discus, mace, lotus — drift up across a dusk field, a line of text
 * resolves, and the whole thing lifts to reveal what is behind it.
 *
 * This component is *controlled* — it plays once when mounted and calls
 * `onDone` when it has finished. Playing it again is a matter of mounting it
 * again with a new key, which is what `IntroProvider` in lib/intro.jsx does.
 * That is what lets the same curtain mark both a page load and a completed
 * puja booking without duplicating any of it.
 *
 * Two things keep it from becoming an obstacle:
 *
 *  - It respects `prefers-reduced-motion` and skips straight to `onDone`, so
 *    nothing downstream waits on an animation that never plays.
 *  - It is `pointer-events: none` for its final fade, so a fast reader can
 *    start clicking before the lift has finished.
 */

const FADE_MS = 700; // must match the transition in .intro (index.css)

// Each symbol gets its own lane, delay, drift and spin so the group never
// reads as a single tweened block. The feather bookends the row; the four
// things Vishnu holds, plus Krishna's flute, fill the lanes between.
const RISING_SYMBOLS = [
  { kind: PeacockFeather, left: '6%', size: 92, delay: 0, drift: 14, spin: -18, dur: 3.4, opacity: 0.5 },
  { kind: Flute, left: '19%', size: 100, delay: 0.45, drift: -10, spin: 12, dur: 3.9, opacity: 0.35 },
  { kind: Shankha, left: '33%', size: 62, delay: 0.15, drift: 20, spin: -8, dur: 3.1, opacity: 0.6 },
  { kind: Chakra, left: '48%', size: 58, delay: 0.7, drift: -16, spin: 22, dur: 4.2, opacity: 0.3 },
  { kind: Gada, left: '62%', size: 44, delay: 0.28, drift: 12, spin: 15, dur: 3.5, opacity: 0.55 },
  { kind: Padma, left: '76%', size: 60, delay: 0.6, drift: -12, spin: -20, dur: 4.0, opacity: 0.34 },
  { kind: PeacockFeather, left: '89%', size: 88, delay: 0.1, drift: 16, spin: 10, dur: 3.3, opacity: 0.46 },
];

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

export default function FeatherIntro({
  title = 'Sri Sri Radha Krishna',
  subtitle = 'Temple',
  /** How long the feathers drift before the curtain lifts. */
  hold = 1500,
  onDone,
}) {
  const [phase, setPhase] = useState('playing');

  // onDone is read through a ref so a caller passing an inline arrow function
  // cannot restart the animation on every render.
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (prefersReducedMotion()) {
      done.current?.();
      return undefined;
    }

    // Nothing behind the curtain should scroll while it is up.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const lift = setTimeout(() => setPhase('lifting'), hold);
    const finish = setTimeout(() => {
      setPhase('gone');
      done.current?.();
    }, hold + FADE_MS);

    return () => {
      clearTimeout(lift);
      clearTimeout(finish);
      document.body.style.overflow = previousOverflow;
    };
  }, [hold]);

  if (phase === 'gone' || prefersReducedMotion()) return null;

  return (
    <div
      className={`intro ${phase === 'lifting' ? 'intro-lifting' : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="intro-rail" />

      <div className="intro-sky">
        {RISING_SYMBOLS.map((f, i) => {
          const Kind = f.kind;
          return (
            <Kind
              key={i}
              className="intro-feather"
              style={{
                left: f.left,
                width: f.size,
                opacity: 0,
                '--drift': `${f.drift}vw`,
                '--spin': `${f.spin}deg`,
                '--peak': f.opacity,
                animationDelay: `${f.delay}s`,
                animationDuration: `${f.dur}s`,
              }}
            />
          );
        })}
      </div>

      <div className="intro-plate">
        <PeacockFeather className="intro-mark" />
        <div className="intro-name">{title}</div>
        {subtitle && <div className="intro-sub">{subtitle}</div>}
      </div>
    </div>
  );
}
