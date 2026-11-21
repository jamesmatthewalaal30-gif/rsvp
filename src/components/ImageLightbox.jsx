import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export default function ImageLightbox({ src, alt, label, imageClassName = '' }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        closeRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return <>
    <button
      ref={triggerRef}
      type="button"
      className="focus-ring block w-full cursor-zoom-in"
      onClick={() => setOpen(true)}
      aria-label={`Enlarge ${label}`}
    >
      <img className={imageClassName} src={src} alt={alt} loading="lazy" />
    </button>
    {open && <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#211610]/90 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <button
        ref={closeRef}
        type="button"
        className="focus-ring absolute right-4 top-4 inline-flex h-11 items-center gap-2 border border-white/50 bg-[#fff8ef] px-4 text-xs font-semibold tracking-[.1em] text-[#570b19] shadow-lg sm:right-6 sm:top-6"
        onClick={() => setOpen(false)}
        aria-label="Close enlarged image"
      >
        <X size={17} /> CLOSE
      </button>
      <img className="max-h-[88vh] max-w-full object-contain shadow-2xl" src={src} alt={alt} />
    </div>}
  </>;
}
