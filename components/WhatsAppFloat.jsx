'use client';

import { usePathname } from 'next/navigation';

const LINK = 'https://wa.me/263787434880?text=Hello%20LUX%20Portal%2C%20I%20have%20a%20question%20about%20my%20application';

export default function WhatsAppFloat() {
  const path = usePathname() || '';
  if (path.startsWith('/admin')) return null;
  return (
    <a className="float-wa" href={LINK} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.4.5-.6.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z" />
      </svg>
    </a>
  );
}
