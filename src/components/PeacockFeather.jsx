/**
 * A full mor-pankh — the peacock feather Krishna wears in his crown.
 *
 * Drawn rather than imported so it inherits the palette from CSS variables and
 * costs no network request: it is used a dozen times on the intro overlay and
 * an <img> each time would defeat the point of the animation.
 *
 * The barbs are generated instead of hand-listed so the fan stays even, and
 * they thin towards the tip the way a real feather does.
 */

const BARBS = 26;

function barbs(side) {
  const out = [];
  for (let i = 0; i < BARBS; i += 1) {
    const t = i / (BARBS - 1);
    // y walks down the stem below the eye; the fan widens as it descends
    const y = 60 + t * 96;
    const spread = 8 + Math.sin(t * Math.PI * 0.8) * 26;
    const droop = 10 + t * 16;
    out.push(
      <path
        key={`${side}-${i}`}
        d={`M40 ${y} Q ${40 + side * spread * 0.6} ${y + droop * 0.4} ${
          40 + side * spread
        } ${y + droop}`}
        stroke="var(--color-peacock-600)"
        strokeWidth={1.1 - t * 0.45}
        strokeLinecap="round"
        fill="none"
        opacity={0.75 - t * 0.35}
      />,
    );
  }
  return out;
}

export default function PeacockFeather({ className = 'h-24 w-24', style }) {
  return (
    <svg
      viewBox="0 0 80 170"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {/* stem */}
      <path
        d="M40 54 C 40 90, 40 120, 39 166"
        stroke="var(--color-peacock-600)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />

      {barbs(-1)}
      {barbs(1)}

      {/* the eye — teal halo, indigo body, marigold heart, dark pupil */}
      <ellipse cx="40" cy="34" rx="24" ry="31" fill="var(--color-peacock-300)" opacity="0.35" />
      <ellipse cx="40" cy="34" rx="17.5" ry="24" fill="var(--color-peacock-600)" opacity="0.92" />
      <ellipse cx="40" cy="32" rx="11.5" ry="16" fill="var(--color-night-800)" />
      <ellipse cx="40" cy="30.5" rx="6" ry="8.4" fill="var(--color-marigold-500)" />
      <ellipse cx="40" cy="29.5" rx="2.6" ry="3.8" fill="var(--color-night-950)" />
      {/* highlight, so the eye reads as glossy rather than flat */}
      <ellipse cx="36.5" cy="25" rx="1.6" ry="2.4" fill="#fff" opacity="0.45" />
    </svg>
  );
}
