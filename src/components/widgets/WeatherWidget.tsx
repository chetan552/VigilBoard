"use client";
import { useEffect, useState } from "react";
import { MapPin, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Eye } from "lucide-react";

type Widget = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: string | null;
};

type WeatherData = {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
    visibility?: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

export function WeatherWidget({ widget, tempUnit = "fahrenheit" }: { widget: Widget; tempUnit?: "fahrenheit" | "celsius" }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const config = typeof widget.config === 'string' ? JSON.parse(widget.config || '{}') : (widget.config || {});
  const locationName = config.location || "Loveland, CO";

  useEffect(() => {
    const BASE_INTERVAL = 300_000; // 5 min
    const MAX_INTERVAL = 1_800_000; // 30 min
    let delay = BASE_INTERVAL;
    let timerId: ReturnType<typeof setTimeout>;

    async function fetchWeather() {
      try {
        setLoading(true);
        setError(false);

        // Geocode the location name using Open-Meteo's free geocoding API
        let lat = 40.3978;
        let lon = -105.075;
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`
        );
        const geoData = await geoRes.json();
        if (geoData.results?.[0]) {
          lat = geoData.results[0].latitude;
          lon = geoData.results[0].longitude;
        }

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,visibility` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
          `&temperature_unit=${tempUnit}&wind_speed_unit=mph&timezone=auto`
        );
        const data = await res.json();
        setWeather(data);
        delay = BASE_INTERVAL; // reset on success
      } catch (e) {
        console.error("Weather error", e);
        setError(true);
        delay = Math.min(delay * 2, MAX_INTERVAL); // back off on failure
      } finally {
        setLoading(false);
        timerId = setTimeout(fetchWeather, delay);
      }
    }

    fetchWeather();
    return () => clearTimeout(timerId);
  }, [locationName, tempUnit]);

  const getIcon = (code: number, size = 64) => {
    if (code <= 3)  return <Sun size={size} className="text-yellow-400" />;
    if (code <= 48) return <Cloud size={size} className="text-gray-400" />;
    if (code <= 67) return <CloudRain size={size} className="text-blue-400" />;
    if (code <= 86) return <CloudSnow size={size} className="text-blue-200" />;
    if (code <= 99) return <CloudLightning size={size} className="text-purple-400" />;
    return <Sun size={size} className="text-yellow-400" />;
  };

  if (loading) return (
    <div className="flex flex-col h-full w-full p-8 items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-[var(--border-color)] border-t-[var(--accent-teal)] rounded-full animate-spin" />
      <p className="text-[var(--text-secondary)]">Loading weather…</p>
    </div>
  );

  if (error || !weather) return (
    <div className="flex flex-col h-full w-full p-8 items-center justify-center gap-3">
      <Cloud size={48} className="text-[var(--text-secondary)]" />
      <p className="text-[var(--text-secondary)]">Weather unavailable</p>
    </div>
  );

  const currentTemp = Math.round(weather.current.temperature_2m);
  const feelsLike = Math.round(weather.current.apparent_temperature);
  const windSpeed = Math.round(weather.current.wind_speed_10m);
  const humidity = weather.current.relative_humidity_2m;
  const visibilityMiles = weather.current.visibility != null
    ? (weather.current.visibility / 1609).toFixed(0)
    : null;

  return (
    <div className="flex flex-col h-full w-full p-4 gap-3 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 glass bg-gradient-to-br from-blue-500/20 to-transparent rounded-xl flex items-center justify-center shrink-0">
            <MapPin size={15} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Weather</p>
            <p className="text-sm font-medium leading-tight">{locationName}</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full shrink-0">Live</span>
      </div>

      {/* Current temp — shrinks if needed */}
      <div className="flex items-center justify-center gap-4 shrink-0">
        {getIcon(weather.current.weather_code, 56)}
        <div className="text-center">
          <div className="text-6xl font-bold leading-none font-[tabular-nums]">{currentTemp}°</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Feels like {feelsLike}°{tempUnit === "celsius" ? "C" : "F"}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        <div className="flex flex-col items-center p-2 glass rounded-xl">
          <Wind size={16} className="text-blue-400 mb-1" />
          <div className="text-[10px] text-[var(--text-secondary)]">Wind</div>
          <div className="text-sm font-bold">{windSpeed}<span className="text-[10px] font-normal ml-0.5">mph</span></div>
        </div>
        <div className="flex flex-col items-center p-2 glass rounded-xl">
          <Droplets size={16} className="text-cyan-400 mb-1" />
          <div className="text-[10px] text-[var(--text-secondary)]">Humidity</div>
          <div className="text-sm font-bold">{humidity}<span className="text-[10px] font-normal ml-0.5">%</span></div>
        </div>
        <div className="flex flex-col items-center p-2 glass rounded-xl">
          <Eye size={16} className="text-violet-400 mb-1" />
          <div className="text-[10px] text-[var(--text-secondary)]">Visibility</div>
          <div className="text-sm font-bold">
            {visibilityMiles != null ? <>{visibilityMiles}<span className="text-[10px] font-normal ml-0.5">mi</span></> : '—'}
          </div>
        </div>
      </div>

      {/* 5-day forecast — fills remaining space, never pushed out */}
      <div className="border-t border-[var(--border-color)]/30 pt-3 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">5-Day Forecast</p>
        <div className="grid grid-cols-5 gap-1.5">
          {[0, 1, 2, 3, 4].map(i => {
            const d = new Date(weather.daily.time[i]);
            const max = Math.round(weather.daily.temperature_2m_max[i]);
            const min = Math.round(weather.daily.temperature_2m_min[i]);
            return (
              <div key={i} className="flex flex-col items-center p-1.5 glass rounded-lg">
                <span className="text-[10px] font-medium text-[var(--text-secondary)] mb-1">
                  {d.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <div className="mb-1">{getIcon(weather.daily.weather_code[i], 18)}</div>
                <span className="font-bold text-xs">{max}°{tempUnit === "celsius" ? "C" : "F"}</span>
                <span className="text-[10px] text-[var(--text-secondary)]">{min}°</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
