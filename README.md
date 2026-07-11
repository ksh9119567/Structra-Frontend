# Structra — Frontend

The web application for **Structra**, a governance-aware work-management platform
(Organizations → Teams → Projects → Tasks). Built with the Next.js App Router, it talks to
the [Structra backend](../Structra-Backend) through a secure server-side layer — the browser
never handles raw credentials or backend tokens directly.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI runtime | React 19 |
| Styling | Tailwind CSS 4 |
| Components | Radix UI + shadcn primitives |
| Icons | lucide-react |

---

## Architecture

Structra's frontend uses a **Backend-for-Frontend (BFF)** pattern:

```
Browser  →  Next.js Route Handlers (app/api/*)  →  Structra DRF backend (/api/v1/*)
```

- The browser calls **same-origin** routes under `app/api/*`.
- Those route handlers attach the auth token (kept in an httpOnly cookie/session) and
  forward the request to the Django backend.
- The backend base URL is configured server-side only via `STRUCTRA_API_URL` and is **never**
  exposed to the client.

### Project structure

```
app/
├── (auth)/              # Login & signup (unauthenticated shell)
├── (dashboard)/         # Authenticated app: dashboard, orgs, teams,
│                        #   projects, tasks, activity, approvals, profile, settings
├── api/                 # BFF route handlers that proxy to the DRF backend
├── privacy/ terms/      # Legal pages
└── page.tsx             # Marketing landing page

features/                # Feature-first UI modules (one folder per domain)
├── auth/  dashboard/  organizations/  teams/  projects/  tasks/
├── profile/  settings/  marketing/  shell/  shared/
lib/                     # Client/server helpers: auth, api client, typed models
config/                  # Sidebar navigation & static shell data
components/              # Shared shadcn/ui primitives
```

Path alias: `@/*` maps to the repo root (e.g. `import { cn } from "@/lib/utils"`).

---

## What's built

The core hierarchy is fully playable end-to-end: **Organizations, Teams, Projects, and
Tasks** (Kanban board, "My Tasks", task detail drawer), plus member/role management,
invitations, ownership transfer, governance settings screens, auth, profile, and account
settings.

A few surfaces are still placeholders (**Approvals** and the full **Activity** page render a
"Coming Soon" state; the org-detail **Teams/Projects** sub-tabs are stubbed). For the full,
current breakdown of what's live vs. pending — and how each screen maps to backend
capabilities — see:

- [`docs/BACKEND_FEATURES_AND_UI_SPEC.md`](docs/BACKEND_FEATURES_AND_UI_SPEC.md) — feature & UI spec with a page checklist
- [`../Structra-Backend/STRUCTRA_PRODUCT_OVERVIEW.md`](../Structra-Backend/STRUCTRA_PRODUCT_OVERVIEW.md) — product-level overview of the whole platform

---

## Getting Started

### 1. Prerequisites

- Node.js 18.18+ (or 20+)
- A running instance of the [Structra backend](../Structra-Backend) (default `http://localhost:8000`)

### 2. Configure environment

Copy the example env file and point it at your backend:

```bash
cp .env.example .env.local
```

```env
# .env.local — server-side only, never exposed to the browser
STRUCTRA_API_URL=http://localhost:8000/api/v1
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## Notes

- All authenticated requests flow through the BFF; components should call `app/api/*` routes,
  not the Django backend directly.
- Typed request/response models live in `lib/<domain>/types.ts`.
- Primary navigation is configured in `config/navigation.ts`.
