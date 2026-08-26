/**
 * Where an uploaded photograph goes.
 *
 * Mirrors PhotoCategory.java. The backend also serves this list from
 * /api/photos/categories and the upload form prefers that copy — this one is
 * the fallback so the form still works if the call is slow, and so the gallery
 * filter and the committee board have labels to render without waiting.
 */
export const PHOTO_CATEGORIES = [
  {
    value: 'TEMPLE',
    label: 'Temple gallery',
    person: false,
    hint: 'Deities, festivals, the building — the ordinary gallery.',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
    person: true,
    hint: 'Your own portrait. This is the only choice that changes your account picture.',
  },
  { value: 'FOUNDER', label: 'Founder', person: true, hint: 'Shown on the committee board.' },
  { value: 'CO_FOUNDER', label: 'Co-founder', person: true, hint: 'Shown on the committee board.' },
  {
    value: 'COMMITTEE_MEMBER',
    label: 'Committee member',
    person: true,
    hint: 'Shown on the committee board.',
  },
];

export const CATEGORY_LABEL = Object.fromEntries(
  PHOTO_CATEGORIES.map((c) => [c.value, c.label]),
);

/** True for the categories that describe a person rather than a place. */
export const IS_PERSON_CATEGORY = Object.fromEntries(
  PHOTO_CATEGORIES.map((c) => [c.value, c.person]),
);

/** Badge colours, matching the palette in index.css. */
export const CATEGORY_STYLE = {
  TEMPLE: 'bg-night-900/8 text-night-800',
  ADMIN: 'bg-rose-temple/10 text-rose-temple',
  FOUNDER: 'bg-marigold-500/20 text-[#8a5a0f]',
  CO_FOUNDER: 'bg-peacock-600/10 text-peacock-600',
  COMMITTEE_MEMBER: 'bg-night-800/10 text-night-800',
};

/** The people categories, in the order the committee board renders them. */
export const PEOPLE_CATEGORIES = ['ADMIN', 'FOUNDER', 'CO_FOUNDER', 'COMMITTEE_MEMBER'];

/** Chips across the top of the gallery. `null` means "everything". */
export const GALLERY_FILTERS = [
  { value: null, label: 'All' },
  { value: 'TEMPLE', label: 'Temple' },
  { value: 'FOUNDER', label: 'Founder' },
  { value: 'CO_FOUNDER', label: 'Co-founder' },
  { value: 'COMMITTEE_MEMBER', label: 'Committee' },
  { value: 'ADMIN', label: 'Admin' },
];
