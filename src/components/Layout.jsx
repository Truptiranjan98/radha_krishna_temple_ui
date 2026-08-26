import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { FeatherMark, RoleBadge } from './Bits';
import SiteFooter, { WhatsAppFab } from './SiteFooter';

const ICONS = {
  home: <path d="M12 3 3 10.2V21h6.4v-6h5.2v6H21V10.2L12 3Z" />,
  calendar: (
    <path d="M7 2v2H5.5A2.5 2.5 0 0 0 3 6.5v13A2.5 2.5 0 0 0 5.5 22h13a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 18.5 4H17V2h-2v2H9V2H7Zm12 8v9.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V10h14Zm-9 2H7v3h3v-3Z" />
  ),
  gallery: (
    <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm2 10.5 4-4.2 3 3.1 3.4-3.6L19 16.6V6H5v10.5Z" />
  ),
  puja: (
    <path d="M12 2c-.6 1.9-1.8 2.9-3 4-1.4 1.3-2.4 2.7-2.4 4.6A5.4 5.4 0 0 0 12 16a5.4 5.4 0 0 0 5.4-5.4c0-1.9-1-3.3-2.4-4.6-1.2-1.1-2.4-2.1-3-4ZM5 18h14v2H5v-2Zm2 3h10v1H7v-1Z" />
  ),
  upload: (
    <path d="M11 16V9.8l-2.6 2.6L7 11l5-5 5 5-1.4 1.4L13 9.8V16h-2ZM5 20v-4h2v2h10v-2h2v4H5Z" />
  ),
  notices: (
    <path d="M18 11V9a6 6 0 0 0-5-5.9V2h-2v1.1A6 6 0 0 0 6 9v2l-2 3.6V17h16v-2.4L18 11Zm-6 5a2.5 2.5 0 0 0 2.4-2H9.6a2.5 2.5 0 0 0 2.4 2Z" />
  ),
  bookings: (
    <path d="M4 4h16v2H4V4Zm0 4h16v12H4V8Zm2 2v8h12v-8H6Zm2 2h5v2H8v-2Zm0 3h8v1.5H8V15Z" />
  ),
  admin: (
    <path d="M12 2 4 5.5v5.9c0 4.6 3.2 8.6 8 10.6 4.8-2 8-6 8-10.6V5.5L12 2Zm0 6a2.2 2.2 0 1 1 0 4.4A2.2 2.2 0 0 1 12 8Zm0 10.4c-1.8 0-3.4-.9-4.3-2.3.9-1.3 2.6-2.1 4.3-2.1s3.4.8 4.3 2.1c-.9 1.4-2.5 2.3-4.3 2.3Z" />
  ),
  more: <path d="M5 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />,
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/** The signed-in user's photo, falling back to their initial. */
export function Avatar({ size = 36 }) {
  const { user, avatarUrl } = useAuth();
  const picture = avatarUrl || user?.pictureUrl;

  if (picture) {
    return (
      <img
        src={picture}
        alt=""
        className="rounded-full object-cover ring-2 ring-peacock-300"
        style={{ height: size, width: size }}
      />
    );
  }
  return (
    <div
      className="grid place-items-center rounded-full bg-night-900 font-bold text-white"
      style={{ height: size, width: size, fontSize: size * 0.4 }}
    >
      {user?.name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the sheet whenever the route changes, otherwise it stays up over
  // the page you just navigated to.
  useEffect(() => setMoreOpen(false), [location.pathname]);

  /*
   * Home, Calendar, Gallery and Puja booking are the temple's public face —
   * a visitor looking up Sandhya Arati or asking for a Satyanarayana Puja
   * should never meet a login wall. Uploading is admin-only now: the admin
   * posts the photographs and everyone else looks.
   */
  const links = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/calendar', label: 'Calendar', icon: 'calendar' },
    { to: '/gallery', label: 'Gallery', icon: 'gallery' },
    { to: '/puja', label: 'Book a puja', icon: 'puja' },
    ...(isAdmin
      ? [
          { to: '/upload', label: 'Upload', icon: 'upload' },
          { to: '/admin/notices', label: 'Notices', icon: 'notices' },
          { to: '/admin/bookings', label: 'Bookings', icon: 'bookings' },
          { to: '/admin', label: 'Manage', icon: 'admin' },
        ]
      : []),
  ];

  /*
   * A phone tab bar holds five items before the labels collide. The old code
   * sliced the list to five and dropped whatever came after — which is why
   * Notices and Manage were invisible on a phone for an admin, whose list is
   * eight long. Now four go in the bar and the rest live behind "More", so
   * nothing is unreachable regardless of how the list grows.
   */
  const BAR_SLOTS = 4;
  const barLinks = links.slice(0, BAR_SLOTS);
  const overflowLinks = links.slice(BAR_SLOTS);
  const overflowActive = overflowLinks.some((l) => location.pathname.startsWith(l.to));

  const handleSignOut = () => {
    signOut();
    setMoreOpen(false);
    navigate('/', { replace: true });
  };

  const sidebarLink = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive ? 'bg-night-900 text-white' : 'text-night-900 hover:bg-paper'
    }`;

  return (
    <div className="min-h-dvh sm:flex">
      {/* mor-pankh rail — vertical beside the sidebar on desktop */}
      <div className="rail hidden w-1 shrink-0 sm:block" aria-hidden="true" />

      {/* desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-paper-raised px-4 py-6 sm:flex">
        <NavLink to="/" className="flex items-center gap-2 px-2">
          <FeatherMark className="h-7 w-7" />
          <div className="leading-tight">
            <div className="font-display text-lg">RadhaKrishna</div>
            <div className="eyebrow">Temple</div>
          </div>
        </NavLink>

        <nav className="mt-8 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={sidebarLink}>
              <Icon name={l.icon} />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-hairline pt-4">
          {user ? (
            <>
              <NavLink
                to="/profile"
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-paper"
              >
                <Avatar size={36} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{user.name}</div>
                  <div className="mt-0.5">
                    <RoleBadge role={user.role} />
                  </div>
                </div>
              </NavLink>
              <button
                onClick={handleSignOut}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-paper"
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/signin" className="btn btn-quiet w-full">
              Temple admin sign in
            </NavLink>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile top bar */}
        <header className="sticky top-0 z-30 border-b border-hairline bg-paper-raised/95 backdrop-blur sm:hidden">
          <div className="rail-h h-0.5 w-full" aria-hidden="true" />
          <div className="flex items-center justify-between px-4 py-3">
            <NavLink to="/" className="flex items-center gap-2">
              <FeatherMark className="h-6 w-6" />
              <span className="font-display text-base">RadhaKrishna</span>
            </NavLink>
            {user ? (
              <NavLink to="/profile" aria-label="Your profile">
                <Avatar size={36} />
              </NavLink>
            ) : (
              <NavLink to="/signin" className="text-sm font-semibold text-peacock-600">
                Sign in
              </NavLink>
            )}
          </div>
        </header>

        {/* pb-24 keeps content clear of the mobile tab bar */}
        <main className="flex-1 px-4 pb-6 pt-5 sm:px-8 sm:pt-8">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>

        {/*
          The footer carries the location and the WhatsApp number, so it sits
          below every page rather than only the front one — a devotee who
          landed on the calendar still needs the gate and the phone number.
          The bottom padding clears the mobile tab bar.
        */}
        <div className="pb-24 sm:pb-0">
          <SiteFooter />
        </div>
      </div>

      <WhatsAppFab />

      {/* ---------------- mobile "More" sheet ---------------- */}
      {moreOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-night-950/45 sm:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-hairline bg-paper-raised p-4 sm:hidden"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            role="dialog"
            aria-label="More"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-hairline" />
            <nav className="flex flex-col gap-1">
              {overflowLinks.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={sidebarLink}>
                  <Icon name={l.icon} />
                  {l.label}
                </NavLink>
              ))}
              {user && (
                <>
                  <NavLink to="/profile" className={sidebarLink}>
                    <Avatar size={20} />
                    Profile
                  </NavLink>
                  <button
                    onClick={handleSignOut}
                    className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-muted hover:bg-paper"
                  >
                    Sign out
                  </button>
                </>
              )}
            </nav>
          </div>
        </>
      )}

      {/* mobile tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-paper-raised sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {barLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.68rem] font-semibold ${
                  isActive ? 'text-peacock-600' : 'text-muted'
                }`
              }
            >
              <Icon name={l.icon} />
              {l.label}
            </NavLink>
          ))}

          {overflowLinks.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.68rem] font-semibold ${
                moreOpen || overflowActive ? 'text-peacock-600' : 'text-muted'
              }`}
            >
              <Icon name="more" />
              More
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
