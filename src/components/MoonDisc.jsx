/**
 * A moon drawn from the tithi.
 *
 * A tithi is not a label that happens to sit near the moon — it *is* the moon,
 * one thirtieth of the way from new to new. So the calendar draws the actual
 * phase rather than printing a badge next to the date: Purnima is a full disc,
 * Amabasya a dark one, and the fortnight between them fills and empties.
 *
 * Construction avoids SVG arc-flag guesswork. Three shapes, painted in order:
 *   1. the whole disc in shadow
 *   2. a clean half-disc on the lit limb (right while waxing, left while waning)
 *   3. an ellipse for the terminator, whose width is |cos(elongation)|
 *      - painted lit when gibbous, so it adds to the half
 *      - painted dark when crescent, so it eats into the half
 *
 * At first quarter the ellipse collapses to zero width and you get exactly half
 * a disc; at Purnima it spans the full width in lit paint; at Amabasya it spans
 * the full width in shadow. No special cases.
 */
export default function MoonDisc({ tithiNumber, size = 18, className = '' }) {
  // Mid-tithi elongation. Tithi 1 spans 0-12 deg, so its midpoint is 6 deg.
  const elongation = ((tithiNumber - 0.5) * 12) % 360;
  const radians = (elongation * Math.PI) / 180;

  const waxing = elongation < 180;
  const gibbous = elongation > 90 && elongation < 270;

  const r = 10;
  const terminatorWidth = Math.abs(Math.cos(radians)) * r;

  // sweep-flag 1 runs clockwise on screen, so from the top it curves right.
  const litHalf = waxing
    ? `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} Z`
    : `M 0 ${-r} A ${r} ${r} 0 0 0 0 ${r} Z`;

  const lit = 'var(--color-marigold-300)';
  const shadow = 'var(--color-night-800)';

  return (
    <svg
      viewBox="-12 -12 24 24"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={moonLabel(tithiNumber)}
    >
      <circle cx="0" cy="0" r={r} fill={shadow} />
      <path d={litHalf} fill={lit} />
      <ellipse cx="0" cy="0" rx={terminatorWidth} ry={r} fill={gibbous ? lit : shadow} />
      <circle
        cx="0"
        cy="0"
        r={r}
        fill="none"
        stroke="var(--color-night-900)"
        strokeOpacity="0.25"
        strokeWidth="0.8"
      />
    </svg>
  );
}

function moonLabel(tithiNumber) {
  if (tithiNumber === 15) return 'Purnima, full moon';
  if (tithiNumber === 30) return 'Amabasya, new moon';
  return tithiNumber < 15 ? 'Waxing moon' : 'Waning moon';
}
