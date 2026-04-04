<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# give me the implementation plan

Here's the complete implementation plan for your DAKboard-style personal dashboard, organized into clear phases:

***

## What We're Building

A full-featured **personal smart dashboard** — a single HTML file you open in Chrome (fullscreen with F11) that shows all your info at a glance. It replicates and extends all DAKboard Pro features: multi-screen layouts, widgets, live data, dark mode, and deep customization — all running locally in your browser with no subscription.

***

## Feature Scope

### Widgets (All Included)

| Widget | Data Source |
| :-- | :-- |
| **Date \& Time** | Live JS clock, large display |
| **Weather** | Open-Meteo API (free, no key needed) |
| **Calendar** | Manual event input + iCal URL parser |
| **Photo Slideshow** | Local file drag-and-drop or URL paste |
| **News Headlines** | RSS feed via AllOrigins proxy |
| **To-Do / Tasks** | In-memory task list |
| **Countdown Timer** | Custom event countdowns |
| **Stock / Crypto Ticker** | CoinGecko free API |
| **Quotes of the Day** | Curated local quote bank |
| **System Clock / Timezone** | Multi-timezone world clock |
| **Sticky Notes** | In-memory notes |
| **Sports Scores** | TheSportsDB free API |


***

## Implementation Phases

### Phase 1 — Design System \& Shell

- Dark-first color palette (dark bg ideal for wall displays, light toggle available)
- Custom SVG logo + favicon
- Sidebar for screen/widget management
- Top bar: clock, screen name, settings, theme toggle
- Grid layout engine: draggable, resizable widget tiles


### Phase 2 — Core Widgets

Build the 5 most essential widgets first:

1. **Clock** — large, crisp, optionally analog
2. **Weather** — current temp + 5-day forecast from Open-Meteo (Loveland, CO by default)
3. **Calendar** — monthly grid + upcoming events list
4. **Photo frame** — URL-based slideshow with crossfade transitions
5. **Quotes** — rotating quote with author

### Phase 3 — Data Widgets

6. **News feed** — RSS via proxy, headline cycling
7. **To-Do list** — add/check/delete tasks
8. **Countdown** — multiple named countdowns
9. **World clock** — 2–4 timezone clocks

### Phase 4 — Advanced \& Settings

- **Widget picker modal** — click `+` to add any widget to the current screen
- **Multi-screen support** — named screens switchable from sidebar (e.g., "Morning", "Work", "Family")
- **Widget settings panels** — each widget has a gear icon → configure it inline
- **Layout presets** — 2-column, 3-column, bento grid, full-screen single widget
- **Fullscreen mode** — button + F11 support
- **Export/Import** — save your layout config as a JSON blob you can paste back in

***

## Technical Stack

| Layer | Choice | Why |
| :-- | :-- | :-- |
| **Structure** | Single HTML file | Open in Chrome, no install |
| **Styling** | CSS custom properties + Nexus dark palette | Design-system-driven, consistent |
| **Icons** | Lucide (CDN) | Clean, consistent 24px icons |
| **Charts** | Chart.js (CDN) | Weather sparklines, etc. |
| **Font** | Satoshi (Fontshare) | Sharp, readable on any screen size |
| **Drag-resize** | interact.js (CDN) | Production-grade drag/resize |
| **APIs** | Open-Meteo, CoinGecko, AllOrigins | All free, no API keys needed |
| **State** | In-memory JS object | No localStorage (sandbox safe) |


***

## Art Direction

- **Tone:** Calm, ambient, information-dense — like a beautiful control room
- **Color:** Deep charcoal backgrounds (`#171614`), teal accent, low-saturation surfaces — easy on the eyes for all-day display
- **Typography:** Satoshi body + large tabular numbers for clock/weather/data
- **Motion:** Subtle — smooth widget transitions, clock ticking, weather icon pulse

***

## Delivery

Everything ships as **one self-contained `.html` file** you can:

- Open directly in Chrome → press F11 for fullscreen wall display
- Pin as a Chrome startup page
- Use on a Raspberry Pi + Chrome kiosk mode (just like a real DAKboard setup)

***

Ready to build? Just say **"build it"** and I'll start Phase 1 immediately, working through all four phases to deliver the complete dashboard.

