/**
 * Krishna's flute, and the four things Vishnu holds — shankha, chakra, gada,
 * padma. Drawn the same way PeacockFeather is: inline SVG using the theme's
 * CSS variables, so they ride along with any palette change and cost no
 * network request. Used alongside the feather in the intro curtain
 * (FeatherIntro.jsx) so the rising field reads as a fuller set of the
 * deity's own symbols rather than one repeated shape.
 */

/** Bansuri — a slender tube with finger holes and a small tied tassel. */
export function Flute({ className = 'h-8 w-32', style }) {
  return (
    <svg viewBox="0 0 140 40" className={className} style={style} aria-hidden="true" focusable="false">
      <line
        x1="10" y1="20" x2="130" y2="20"
        stroke="var(--color-marigold-500)"
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.88"
      />
      <line x1="10" y1="20" x2="130" y2="20" stroke="var(--color-night-900)" strokeWidth="7" strokeLinecap="round" opacity="0.08" />
      {[40, 56, 72, 88, 104].map((x) => (
        <circle key={x} cx={x} cy="20" r="2.1" fill="var(--color-night-900)" opacity="0.5" />
      ))}
      {/* tied tassel at the mouth end */}
      <path d="M12 20 q-7 -9 -2 -16" stroke="var(--color-peacock-500)" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.65" />
      <path d="M12 20 q-7 9 -2 16" stroke="var(--color-peacock-500)" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.65" />
    </svg>
  );
}

/** Shankha — the conch, as a curled horn silhouette with a spiral seam. */
export function Shankha({ className = 'h-14 w-14', style }) {
  return (
    <svg viewBox="0 0 60 70" className={className} style={style} aria-hidden="true" focusable="false">
      <path
        d="M30 4 C 45 10 51 27 46 41 C 43 53 32 61 21 62.5 C 13 63.6 7 58.8 7.5 50.8
           C 8 44.5 13.5 41.6 18.3 43.8 C 22.6 45.8 21.8 51.5 17.5 52.8"
        fill="var(--color-paper-raised)"
        stroke="var(--color-marigold-500)"
        strokeWidth="2.2"
        opacity="0.92"
      />
      <path
        d="M30 4 C 40 12 44 26 40 38 C 37 47.5 29 53.5 21 54.5"
        fill="none"
        stroke="var(--color-peacock-500)"
        strokeWidth="1.4"
        opacity="0.55"
      />
      <circle cx="12" cy="49.5" r="2.6" fill="var(--color-night-800)" opacity="0.45" />
    </svg>
  );
}

/** Sudarshan Chakra — a spoked, spinning discus. */
export function Chakra({ className = 'h-12 w-12', style }) {
  const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  return (
    <svg viewBox="0 0 60 60" className={className} style={style} aria-hidden="true" focusable="false">
      <circle cx="30" cy="30" r="21" fill="none" stroke="var(--color-marigold-500)" strokeWidth="2.2" opacity="0.85" />
      {spokes.map((rad, i) => {
        const x = 30 + 21 * Math.cos(rad);
        const y = 30 + 21 * Math.sin(rad);
        const tx = 30 + 25 * Math.cos(rad);
        const ty = 30 + 25 * Math.sin(rad);
        return (
          <g key={i}>
            <line x1="30" y1="30" x2={x} y2={y} stroke="var(--color-marigold-500)" strokeWidth="1.2" opacity="0.5" />
            <line x1={x} y1={y} x2={tx} y2={ty} stroke="var(--color-peacock-500)" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
          </g>
        );
      })}
      <circle cx="30" cy="30" r="5.5" fill="var(--color-peacock-600)" opacity="0.9" />
    </svg>
  );
}

/** Gada — the mace: a ribbed round head on a staff. */
export function Gada({ className = 'h-16 w-8', style }) {
  return (
    <svg viewBox="0 0 40 90" className={className} style={style} aria-hidden="true" focusable="false">
      <line x1="20" y1="32" x2="20" y2="84" stroke="var(--color-night-800)" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
      <circle cx="20" cy="20" r="17" fill="var(--color-marigold-500)" opacity="0.88" />
      <circle cx="20" cy="20" r="17" fill="none" stroke="var(--color-peacock-600)" strokeWidth="1.6" opacity="0.5" />
      <circle cx="20" cy="20" r="9.5" fill="none" stroke="var(--color-night-900)" strokeWidth="1.1" opacity="0.3" />
    </svg>
  );
}

/** Padma — the lotus, in bloom: eight petals around a golden heart. */
export function Padma({ className = 'h-12 w-12', style }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 60 60" className={className} style={style} aria-hidden="true" focusable="false">
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx="30" cy="30" rx="7.5" ry="18"
          fill="var(--color-peacock-300)"
          opacity="0.6"
          transform={`rotate(${deg} 30 30)`}
        />
      ))}
      <circle cx="30" cy="30" r="6.5" fill="var(--color-marigold-500)" opacity="0.92" />
    </svg>
  );
}
