import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { FALLBACK_TEMPLE_INFO } from '../lib/temple';

/**
 * The temple's contact block, starting from the bundled copy and upgrading to
 * the server's when it arrives.
 *
 * Both the footer and the floating button want this and both are mounted on
 * every page, so it goes through the shared request rather than firing two
 * identical calls per navigation. There is never a loading state: the fallback
 * is already correct, so the swap is invisible unless the server disagrees.
 */
function useTempleContact() {
  const [contact, setContact] = useState(FALLBACK_TEMPLE_INFO.contact);

  useEffect(() => {
    let cancelled = false;
    api
      .templeInfoCached()
      .then((info) => {
        if (!cancelled && info?.contact) setContact(info.contact);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return contact;
}

/**
 * The foot of every page: where the temple is, and how to reach it.
 *
 * The contact block travels with the darshan timings from
 * /api/public/temple-info, so a changed number is a config change on the
 * server rather than a frontend rebuild. The bundled fallback in temple.js
 * keeps the footer correct if that call is slow or the server is down —
 * a visitor standing outside looking for directions is exactly the person
 * least able to wait for a retry.
 */
export default function SiteFooter() {
  const contact = useTempleContact();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-hairline bg-paper-raised">
      <div className="rail-h h-0.5 w-full" aria-hidden="true" />

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-8 md:grid-cols-2">
        {/* ---------------- location ---------------- */}
        <section>
          <p className="eyebrow">Find us</p>
          <h2 className="mt-1 text-2xl">Temple location</h2>

          <p className="mt-3 text-sm leading-relaxed text-muted">{contact.address}</p>

          <div className="mt-4 overflow-hidden rounded-xl border border-hairline">
            {/*
              An iframe embed rather than the Maps JavaScript API: this needs no
              API key, no billing account and no script on the page, and it
              still pans and zooms. `loading="lazy"` keeps it off the critical
              path — it sits below the fold on every page.
            */}
            <iframe
              title="Map showing the temple location"
              src={`https://www.google.com/maps?q=${contact.latitude},${contact.longitude}&z=16&output=embed`}
              className="h-56 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={contact.directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-peacock !py-2 !text-xs"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M21.4 11.6 12.4 2.6a.9.9 0 0 0-1.3 0l-8.5 8.5a.9.9 0 0 0 0 1.3l9 9a.9.9 0 0 0 1.3 0l8.5-8.5a.9.9 0 0 0 0-1.3ZM13 15v-2.5h-3V15H8.5v-3.3c0-.5.4-.9.9-.9H13V8.5l3.3 3.3L13 15Z" />
              </svg>
              Get directions
            </a>
            <a
              href={contact.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-quiet !py-2 !text-xs"
            >
              Open in Google Maps
            </a>
          </div>
        </section>

        {/* ---------------- contact ---------------- */}
        <section>
          <p className="eyebrow">Talk to us</p>
          <h2 className="mt-1 text-2xl">Contact the temple</h2>

          <p className="mt-3 text-sm leading-relaxed text-muted">
            For pujas, donations, seva or anything else — message the temple office on
            WhatsApp and someone will get back to you.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <a
              href={contact.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-hairline p-3 transition-colors hover:bg-paper"
            >
              <WhatsAppMark className="h-9 w-9 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">WhatsApp</span>
                <span className="block text-sm tabular-nums text-muted">
                  {formatNumber(contact.whatsappNumber)}
                </span>
              </span>
            </a>

            <a
              href={`tel:+91${digitsOf(contact.phoneNumber)}`}
              className="flex items-center gap-3 rounded-xl border border-hairline p-3 transition-colors hover:bg-paper"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-peacock-600/10"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-peacock-600">
                  <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.3.2 2.5.57 3.6a1 1 0 0 1-.25 1l-2.2 2.2Z" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Call</span>
                <span className="block text-sm tabular-nums text-muted">
                  {formatNumber(contact.phoneNumber)}
                </span>
              </span>
            </a>
          </div>
        </section>
      </div>

      <div className="border-t border-hairline px-4 py-5 text-center text-xs text-muted sm:px-8">
        © {year} {FALLBACK_TEMPLE_INFO.name}
      </div>
    </footer>
  );
}

/** A floating WhatsApp button, so the number is one tap away on any page. */
export function WhatsAppFab() {
  const contact = useTempleContact();

  return (
    <a
      href={contact.whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Message the temple on WhatsApp"
      /*
        bottom-28 on phones clears the tab bar, which is fixed at the bottom
        and would otherwise sit on top of this. On desktop there is no tab bar,
        so it drops back down to bottom-6.
      */
      className="fixed bottom-28 right-4 z-30 grid h-14 w-14 place-items-center rounded-full shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
      style={{ background: '#25D366' }}
    >
      <WhatsAppGlyph className="h-7 w-7 fill-white" />
    </a>
  );
}

function WhatsAppMark({ className }) {
  return (
    <span
      className={`grid place-items-center rounded-full ${className}`}
      style={{ background: '#25D366' }}
      aria-hidden="true"
    >
      <WhatsAppGlyph className="h-5 w-5 fill-white" />
    </span>
  );
}

function WhatsAppGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2a9.9 9.9 0 0 0-8.5 15l-1.4 5.1 5.2-1.4A9.9 9.9 0 1 0 12 2Zm0 18.1c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7.2 4Zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5v-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1.1 2.7a10 10 0 0 0 3.9 3.4c1.5.6 2 .6 2.4.6.5 0 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.3Z" />
    </svg>
  );
}

/** "9337797478" -> "+91 93377 97478". Easier to read back over a phone. */
function formatNumber(raw) {
  const digits = digitsOf(raw);
  if (digits.length !== 10) return raw;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function digitsOf(raw) {
  return String(raw ?? '').replace(/\D/g, '');
}
