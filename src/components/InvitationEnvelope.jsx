import { useEffect, useState } from 'react';
export default function InvitationEnvelope({ onOpen, onOpening }) {
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!opening) return undefined;
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 1550;
    const timer = window.setTimeout(onOpen, delay);
    return () => window.clearTimeout(timer);
  }, [onOpen, opening]);

  function openInvitation() {
    if (!opening) {
      setOpening(true);
      onOpening();
      window.dispatchEvent(new CustomEvent('wedding:play-music'));
    }
  }

  return (
    <div
        className={`invitation-gate${opening ? ' is-opening' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Wedding invitation"
      >
      <svg className="invitation-frame" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path
          className="invitation-frame-accent"
          pathLength="1"
          d="M 112 39 C 230 24 340 51 500 37 S 780 24 888 39 Q 960 39 960 112 C 974 260 948 365 962 500 S 974 746 960 888 Q 960 960 888 960 C 740 974 635 948 500 962 S 220 974 112 960 Q 39 960 39 888 C 24 740 50 635 37 500 S 24 220 39 112 Q 39 39 112 39 Z"
        />
        <path
          className="invitation-frame-main"
          pathLength="1"
          d="M 100 24 C 220 8 330 38 500 22 S 790 8 900 24 Q 976 24 976 100 C 990 250 964 355 978 500 S 990 760 976 900 Q 976 976 900 976 C 750 990 645 964 500 978 S 220 990 100 976 Q 24 976 24 900 C 8 750 36 645 22 500 S 8 220 24 100 Q 24 24 100 24 Z"
        />
      </svg>
      <div className="invitation-gate-content">
        <p className="invitation-eyebrow">YOU ARE INVITED</p>
        <button
          type="button"
          className="envelope-button focus-ring"
          onClick={openInvitation}
          aria-label="Open the invitation from Nathaniel and Kimberly"
          disabled={opening}
        >
          <span className="envelope-art" aria-hidden="true">
            <span className="envelope-ribbon envelope-ribbon-vertical" />
            <span className="envelope-ribbon envelope-ribbon-horizontal" />
            <span className="envelope-flap" />
            <svg className="envelope-sprig" viewBox="0 0 70 90" fill="none">
              <path d="M8 80C22 59 34 39 61 10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M18 64C7 62 4 54 4 48C12 48 19 52 21 59M28 49C18 44 18 36 20 30C28 33 32 39 32 45M39 34C32 26 35 18 39 13C46 19 48 25 44 31M45 27C47 17 55 15 62 16C61 24 56 29 48 30M29 49C35 41 43 43 48 46C44 53 38 56 32 53" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="envelope-copy">
              <span className="envelope-names">Nathaniel &amp; Kimberly</span>
              <span className="envelope-seal">N <span>&amp;</span> K</span>
            </span>
          </span>
        </button>
        <p className="invitation-caption">A special day, shared with you.</p>
        <button
          type="button"
          className="open-invitation-button focus-ring"
          onClick={openInvitation}
          disabled={opening}
        >
          {opening ? 'Opening Invitation…' : 'Tap to open'}
        </button>
        <span className="sr-only">Or use the Open Invitation button below.</span>
        <button
          type="button"
          className="open-invitation-alternative focus-ring"
          onClick={openInvitation}
          disabled={opening}
        >
          Open Invitation
        </button>
      </div>
    </div>
  );
}
