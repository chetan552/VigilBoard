"use client";
import { useEffect, useRef, useState } from "react";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

export function PhotosWidget({ widget }: { widget: Widget }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const config = typeof widget.config === 'string' ? JSON.parse(widget.config || '{}') : (widget.config || {});

  const localPhotos: string[] = Array.isArray(config.photos) && config.photos.length > 0
    ? config.photos
    : [];

  const query = config.query || "nature";
  const picsumPhotos = [
    `https://picsum.photos/seed/${encodeURIComponent(query)}1/1920/1080`,
    `https://picsum.photos/seed/${encodeURIComponent(query)}2/1920/1080`,
    `https://picsum.photos/seed/${encodeURIComponent(query)}3/1920/1080`,
  ];

  const photoUrls = localPhotos.length > 0 ? localPhotos : picsumPhotos;
  const intervalMs = (config.interval || 15) * 1000;

  // fit: 'cover' | 'contain' | 'fill' | 'center'
  const fitMap: Record<string, string> = {
    cover:   'bg-cover bg-center',
    contain: 'bg-contain bg-center bg-no-repeat',
    fill:    'bg-[length:100%_100%] bg-no-repeat',
    center:  'bg-auto bg-center bg-no-repeat',
  };
  const fitClass = fitMap[config.fit || 'cover'] ?? fitMap.cover;

  useEffect(() => {
    setCurrentIndex(0);
  }, [widget.config]);

  useEffect(() => {
    if (photoUrls.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(c => (c + 1) % photoUrls.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [photoUrls.length, intervalMs]);

  const swipeStartX = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    swipeStartX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(dx) > 40) {
      setCurrentIndex(c => (c + (dx < 0 ? 1 : -1) + photoUrls.length) % photoUrls.length);
    }
  };

  return (
    <div
      className="w-full h-full relative bg-black animate-fade-in overflow-hidden touch-pan-y"
      onPointerDown={photoUrls.length > 1 ? handlePointerDown : undefined}
      onPointerUp={photoUrls.length > 1 ? handlePointerUp : undefined}
    >
      {photoUrls.map((url, i) => (
        <div
          key={url}
          className={`absolute inset-0 ${fitClass} transition-opacity duration-1000`}
          style={{
            backgroundImage: `url('${url}')`,
            opacity: i === currentIndex ? 1 : 0,
          }}
        />
      ))}
      {photoUrls.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
          {photoUrls.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to photo ${i + 1}`}
              className={`h-6 px-1 flex items-center justify-center transition-all`}
            >
              <span className={`block rounded-full transition-all ${i === currentIndex ? 'w-3 h-3 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
