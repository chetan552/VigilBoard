"use client";
import { useEffect, useState } from "react";

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

  return (
    <div className="w-full h-full relative bg-black animate-fade-in overflow-hidden">
      {photoUrls.map((url, i) => (
        <div
          key={url}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url('${url}')`,
            opacity: i === currentIndex ? 1 : 0,
          }}
        />
      ))}
      {photoUrls.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {photoUrls.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
