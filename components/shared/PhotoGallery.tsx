'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Building2, ChevronLeft, ChevronRight, X } from 'lucide-react';

type Props = {
  photos: string[];
  alt: string;
};

export function PhotoGallery({ photos, alt }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = useCallback(() => setActive((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setActive((i) => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, prev, next]);

  if (photos.length === 0) {
    return (
      <div className="h-52 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
        <Building2 className="h-16 w-16 text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {/* Main photo */}
        <div
          className="relative h-52 rounded-xl overflow-hidden cursor-zoom-in bg-slate-100 group"
          onClick={() => setLightbox(true)}
        >
          <Image src={photos[active]} alt={alt} fill className="object-cover" sizes="480px" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          {photos.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/55 text-white text-xs px-2 py-0.5 rounded-full">
              {active + 1} / {photos.length}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">Click to enlarge</span>
          </span>
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {photos.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActive(i)}
                className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === active ? 'border-primary-500' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <Image src={url} alt={`${alt} ${i + 1}`} fill className="object-cover" sizes="56px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-1.5"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          {photos.length > 1 && (
            <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums">
              {active + 1} / {photos.length}
            </span>
          )}

          {/* Prev */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2"
            >
              <ChevronLeft className="h-9 w-9" />
            </button>
          )}

          {/* Full-size image */}
          <div
            className="relative mx-16 max-w-5xl w-full"
            style={{ maxHeight: '88vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[active]}
              alt={alt}
              width={1400}
              height={900}
              className="object-contain w-full rounded-lg"
              style={{ maxHeight: '88vh' }}
              sizes="100vw"
              priority
            />
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2"
            >
              <ChevronRight className="h-9 w-9" />
            </button>
          )}

          {/* Bottom thumbnail strip in lightbox */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActive(i); }}
                  className={`relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    i === active ? 'border-white scale-110' : 'border-white/30 hover:border-white/70'
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="48px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
