# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

Database setup (first time or after schema changes):
```bash
npx prisma migrate dev   # Apply migrations and regenerate client
npx prisma db push       # Push schema changes without migration history
npx prisma studio        # GUI to inspect/edit data
```

There are no automated tests.

## Architecture

**Vigilboard** is a DAKboard-style personal dashboard with an admin panel (`/admin`) and a live display screen (`/screen/[id]`). The live screen is optimized for wall-mount always-on displays.

### Data Model

- **Screen** — a named dashboard containing many Widgets
- **Widget** — positioned on a 12-column × 8-row CSS grid with `x, y, w, h` integers and a `config` JSON string for type-specific settings
- **Task** — task items grouped by `listName` (family member names: Erel, Asaph, Eden, Ashira)
- **Config** — key-value store for global app state (e.g., `google_refresh_token`)

Database is SQLite (`prisma/dev.db`). Prisma client singleton is in [src/lib/prisma.ts](src/lib/prisma.ts).

### Widget System

Widget types: `clock`, `weather`, `calendar`, `photos`, `quotes`, `tasks`, `text`, `countdown`, `news`, `worldclock`.

[src/components/widgets/WidgetRenderer.tsx](src/components/widgets/WidgetRenderer.tsx) routes a widget's `type` string to its component. Individual widget components live in [src/components/widgets/](src/components/widgets/). Client-side widgets (clock, weather) are marked `"use client"` and fetch/update on intervals. `TasksWidget` is a server component that queries the DB directly.

Widget config is stored as a JSON string in `widget.config` and parsed within each widget component.

### Layout & Styling

The live screen renders a 12-col × 8-row CSS grid. Each widget is placed via `gridColumnStart/End` and `gridRowStart/End` derived from its `x, y, w, h` values.

Design system is defined in [src/app/globals.css](src/app/globals.css) using CSS custom properties (dark palette, `--accent-teal: #00d4aa`, glass morphism utilities). Tailwind CSS v4 is used alongside these custom classes.

### Admin Panel

- **`/admin`** — list/create/delete screens ([src/app/admin/page.tsx](src/app/admin/page.tsx))
- **`/admin/screen/[id]`** — layout editor ([src/app/admin/screen/[id]/LayoutBuilder.tsx](src/app/admin/screen/[id]/LayoutBuilder.tsx)); saving widgets calls a server action in [src/app/admin/screen/[id]/actions.ts](src/app/admin/screen/[id]/actions.ts) that deletes all existing widgets for the screen and recreates them
- **`/admin/settings`** — Google OAuth connect flow
- **`/admin/tasks`** — task management (stub)

### Google OAuth

Flow: `/api/auth/google` → Google consent → `/api/auth/google/callback` saves refresh token to the `Config` table. Helper utilities are in [src/lib/google-auth.ts](src/lib/google-auth.ts).

### Auth

`/admin/*` and `/api/screens/*` are protected by [src/middleware.ts](src/middleware.ts). It checks an `httpOnly` session cookie against `SESSION_SECRET`. The login page is `/login` (server action sets the cookie). Logout POSTs to `/api/auth/logout`. The live screen (`/screen/[id]`) is intentionally unprotected.

Required `.env` variables:
```
DATABASE_URL="file:./dev.db"
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_PASSWORD="your-password"
SESSION_SECRET="long-random-string"
```
