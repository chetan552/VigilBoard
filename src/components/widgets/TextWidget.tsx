"use client";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

export function TextWidget({ widget }: { widget: Widget }) {
  const config = typeof widget.config === 'string' ? JSON.parse(widget.config) : (widget.config || {});
  const text = config.text || "Your custom text here";
  const size = config.size || "text-4xl";
  const align = config.align || "text-center";
  
  return (
    <div className={`flex items-center justify-center p-8 h-full w-full ${align} animate-fade-in`}>
      <div className={`font-medium ${size} text-[var(--text-primary)] leading-tight drop-shadow-[0_0_10px_rgba(0,212,170,0.2)]`}>
        {text}
      </div>
    </div>
  );
}
