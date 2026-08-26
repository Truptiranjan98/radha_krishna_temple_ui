import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import AuthedImage from './AuthedImage';
import { CATEGORY_LABEL, CATEGORY_STYLE, PEOPLE_CATEGORIES } from '../lib/photoCategories';

/**
 * The people behind the temple, on the front page.
 *
 * Renders nothing at all until there is somebody to show — an empty
 * "Our committee" heading over a blank strip looks like a fault rather than a
 * temple that has not added its photographs yet.
 */
export default function TeamSection() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api
      .team()
      .then((list) => setMembers(Array.isArray(list) ? list : []))
      .catch(() => setMembers([]));
  }, []);

  if (members.length === 0) return null;

  // Admin, then Founder, Co-founder, Committee — matching the order the
  // backend sorts by, but grouped so each gets its own heading.
  const groups = PEOPLE_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABEL[category] ?? category,
    people: members.filter((m) => m.category === category),
  })).filter((g) => g.people.length > 0);

  return (
    <section className="mt-12">
      <div className="section-head">
        <p className="eyebrow">Seva</p>
        <h2 className="mt-1 text-2xl sm:text-3xl">The temple committee</h2>
      </div>

      <div className="mt-5 flex flex-col gap-7">
        {groups.map((group) => (
          <div key={group.category}>
            <p className="eyebrow">{group.label}</p>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {group.people.map((person) => (
                <MemberCard key={person.id} person={person} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function MemberCard({ person }) {
  return (
    <li className="card overflow-hidden">
      <AuthedImage
        photoId={person.id}
        alt={person.personName || person.caption || person.categoryLabel}
        className="arch aspect-[4/5] w-full object-cover"
      />
      <div className="p-3">
        <p className="truncate text-sm font-semibold">
          {person.personName || person.ownerName}
        </p>
        {person.personTitle && (
          <p className="mt-0.5 truncate text-xs text-muted">{person.personTitle}</p>
        )}
        <span
          className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold tracking-wide ${
            CATEGORY_STYLE[person.category] || 'bg-hairline text-muted'
          }`}
        >
          {person.categoryLabel || CATEGORY_LABEL[person.category]}
        </span>
      </div>
    </li>
  );
}
