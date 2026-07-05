# Structra — Frontend Architecture & Design System Specification

> **Status:** Living document · **Owner:** Frontend Platform · **Audience:** All frontend engineers and designers
> **Stack of record:** Next.js 16.2.6 (App Router) · React 19.2 · TypeScript 5 · Tailwind CSS v4 · ShadCN (`radix-nova`) · Radix UI · Lucide · Geist

This is the source of truth for how we build the Structra web client. It defines the folder layout, module boundaries, routing and layout strategy, state and data conventions, and the full design system (color, type, spacing, radius, components). When in doubt, follow this document. When this document is wrong, fix it in a PR.

---

## 1. Design Philosophy

Structra is an enterprise task management and governance platform. The UI has to carry **Jira-level functionality** (deep object models, bulk actions, permissions, audit trails) while feeling like **Linear** (fast, quiet, keyboard-first) and reading like **Notion** (clean surfaces, generous whitespace, low chrome).

Three principles drive every decision:

1. **Calm density.** Show a lot of information without shouting. Hierarchy comes from spacing, weight, and muted color — not borders and saturation.
2. **Speed is a feature.** Default to Server Components, prefetch aggressively, stream with `loading.tsx`, and keep client bundles small. Navigation should feel instant.
3. **Dark mode first.** The dark theme is the primary canvas and is designed first. Light mode is a fully supported, equal-quality second theme — never an afterthought.

Visual tone: neutral zinc surfaces, a single restrained indigo accent, hairline borders, and motion that is short and functional (150–200ms), never decorative.

---

## 2. Tech Stack (of record)

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js 16.2.6** | App Router only. No Pages Router. |
| UI runtime | **React 19.2** | Server Components by default; `'use client'` only at interactivity boundaries. |
| Language | **TypeScript 5** (`strict`) | No implicit `any`. `@/*` → project root. |
| Styling | **Tailwind CSS v4** | CSS-first config via `@theme inline` in `app/globals.css`. No `tailwind.config.js`. |
| Components | **ShadCN (`radix-nova` style)** | CVA + `data-slot` pattern, owned in-repo under `components/ui`. |
| Primitives | **Radix UI** (`radix-ui` package) | Accessibility + behavior for overlays, menus, etc. |
| Icons | **Lucide React** | 16px default in dense UI; stroke 1.5–2. |
| Fonts | **Geist Sans / Geist Mono** | Loaded via `next/font/google`. |
| Color model | **OKLCH** | All tokens authored in OKLCH for perceptual consistency. |

**Recommended additions** (not yet installed — proposed in §8/§9). Treat these as the planned standard:

| Concern | Recommendation |
| --- | --- |
| Server state / caching | **TanStack Query v5** |
| Client/UI state | **Zustand** (only where Context is insufficient) |
| URL state (filters, tabs, pagination) | **nuqs** |
| Forms | **React Hook Form** + **Zod** |
| Theme toggle | **next-themes** |
| Tables | **TanStack Table v8** (headless) over our styled primitives |

---

## 3. Folder Structure

We keep the `app/` directory **routing-only** and place application code in top-level shared folders, with feature logic isolated under `features/`. This matches the project's existing `@/*` → root alias (no `src/` folder).

```
structra-frontend/
├── app/                          # Routing layer ONLY (route groups, layouts, pages, loading/error)
│   ├── (auth)/                   #   Unauthenticated routes (login, accept-invite, reset)
│   ├── (app)/                    #   Authenticated product shell
│   ├── api/                      #   Route handlers / BFF endpoints (proxy, webhooks)
│   ├── layout.tsx                #   Root layout (html, body, providers, fonts)
│   ├── globals.css               #   Tailwind v4 theme + tokens (source of truth)
│   ├── not-found.tsx
│   └── error.tsx
│
├── features/                     # Feature-based modules (see §4) — the heart of the app
│   ├── auth/
│   ├── organizations/
│   ├── teams/
│   ├── projects/
│   ├── tasks/
│   ├── rbac/
│   ├── approvals/
│   ├── governance/
│   ├── feature-flags/
│   └── activity/
│
├── components/                   # Shared, cross-feature UI
│   ├── ui/                       #   ShadCN primitives (Button, Dialog, Table, …) — owned in-repo
│   ├── layout/                   #   App shell: Sidebar, Topbar, PageHeader, Breadcrumbs
│   ├── data/                     #   DataTable, EmptyState, Pagination, Filters
│   ├── feedback/                 #   Toaster, Skeletons, ErrorState, ConfirmDialog
│   └── forms/                    #   Field, FormSection, form-aware inputs
│
├── lib/                          # Framework-agnostic utilities & infra
│   ├── api/                      #   Typed fetch client + endpoint modules (see §8)
│   ├── auth/                     #   Session helpers, token handling
│   ├── query/                    #   TanStack Query client + keys factory
│   ├── utils.ts                  #   cn(), formatters, guards
│   └── constants.ts
│
├── hooks/                        # Cross-feature React hooks (useMediaQuery, useDebounce, …)
├── types/                        # Global/shared types and API DTOs
├── config/                       # nav.ts, site.ts, permissions.ts, feature-flags defaults
├── public/                       # Static assets
└── styles/                       # Optional: additional layered CSS (rare; prefer globals.css)
```

### Placement rules

- **Routing files live in `app/`.** A folder under `app/` exists to map a URL. Pages stay thin — they compose feature modules and pass server-fetched data down.
- **Business UI lives in `features/`.** If a screen is specific to Tasks, its components, hooks, and data access belong in `features/tasks/`, not in `app/`.
- **`components/` is for the genuinely shared.** Promote to `components/` only when a second feature needs it. Avoid premature sharing.
- **`lib/` has no JSX with feature semantics.** It is HTTP, auth, query infra, and pure helpers.
- **Private colocation** is allowed in `app/` using `_components`/`_lib` folders when a UI fragment is truly route-local and not reusable.

---

## 4. Feature-Based Module Structure

Each backend module maps to one frontend feature module. A feature is a **vertical slice**: its own components, data access, hooks, types, and schemas. Features may depend on `components/`, `lib/`, `hooks/`, and `types/` — **never on each other's internals**. Cross-feature reuse goes through a feature's public `index.ts` barrel.

```
features/tasks/
├── components/                   # Feature UI (TaskBoard, TaskRow, TaskDetailPanel, …)
│   ├── task-board.tsx
│   ├── task-table.tsx
│   ├── task-status-badge.tsx
│   └── task-detail-sheet.tsx
├── api/                          # Endpoint calls for this feature (thin wrappers over lib/api)
│   └── tasks.api.ts
├── hooks/                        # Query/mutation hooks (useTasks, useUpdateTask, …)
│   ├── use-tasks.ts
│   └── use-update-task.ts
├── schemas/                      # Zod schemas (create/update/filter)
│   └── task.schema.ts
├── types.ts                      # Feature-local types derived from DTOs
├── permissions.ts                # Which RBAC actions gate which UI affordances
└── index.ts                      # Public surface (re-exports intended for other modules)
```

### Module map (backend → frontend)

| Backend module | Feature dir | Primary surfaces |
| --- | --- | --- |
| Authentication | `features/auth` | Login, accept-invite, password reset, session bootstrap |
| Organizations | `features/organizations` | Org switcher, org settings, members, billing seat |
| Teams | `features/teams` | Team list, team detail, membership management |
| Projects | `features/projects` | Project list, project overview, settings |
| Tasks | `features/tasks` | Board/Table/List views, task detail, bulk actions |
| RBAC | `features/rbac` | Roles, permission matrix, role assignment |
| Approval Workflow | `features/approvals` | Approval queue, request detail, decision actions |
| Governance Policies | `features/governance` | Policy list, policy editor, evaluation log |
| Feature Flags | `features/feature-flags` | Flag list, targeting rules, environments |
| Activity Logging | `features/activity` | Activity feed, audit timeline, filters/export |

### Dependency rules (enforced via ESLint `no-restricted-imports`)

- `features/*` **must not** import from `app/*`.
- `features/a` **must not** deep-import `features/b/...`; only `features/b` (barrel) if a cross-feature need is real.
- `components/`, `lib/`, `hooks/`, `types/` **must not** import from `features/*` (keep shared code feature-agnostic).

---

## 5. Routing Strategy

Next.js 16 App Router, file-system routing. We organize with **route groups** so URLs stay clean while layouts differ by section.

```
app/
├── (auth)/                       # No app chrome; centered card layout
│   ├── layout.tsx
│   ├── login/page.tsx            # /login
│   ├── accept-invite/page.tsx    # /accept-invite
│   └── reset-password/page.tsx   # /reset-password
│
├── (app)/                        # Authenticated shell (sidebar + topbar)
│   ├── layout.tsx                # Guards session; renders AppShell
│   ├── page.tsx                  # / → redirect to default org/home
│   │
│   └── [orgSlug]/                # Org-scoped workspace
│       ├── layout.tsx            # Loads org context, nav, RBAC for org
│       ├── page.tsx              # /:org (dashboard)
│       │
│       ├── projects/
│       │   ├── page.tsx          # /:org/projects
│       │   └── [projectId]/
│       │       ├── layout.tsx    # Project tabs (Overview/Tasks/Settings)
│       │       ├── page.tsx      # /:org/projects/:id
│       │       ├── tasks/
│       │       │   ├── page.tsx              # Board/Table view
│       │       │   ├── loading.tsx           # Skeleton (enables partial prefetch)
│       │       │   └── @modal/(.)t/[taskId]/page.tsx  # Intercepted task detail modal
│       │       └── settings/page.tsx
│       │
│       ├── teams/[teamId]/page.tsx
│       ├── approvals/page.tsx
│       ├── governance/page.tsx
│       ├── activity/page.tsx
│       └── settings/             # Org settings (RBAC, flags, members)
│           ├── members/page.tsx
│           ├── roles/page.tsx
│           └── feature-flags/page.tsx
```

### Conventions

- **Route groups `(group)`** separate the auth experience from the product shell without affecting URLs.
- **Dynamic segments** are `[orgSlug]`, `[projectId]`, `[taskId]`. In Next.js 16, `params` and `searchParams` are **async (Promises)** — always `await` them in Server Components:

  ```tsx
  // app/(app)/[orgSlug]/projects/[projectId]/page.tsx
  export default async function Page(props: PageProps<'/[orgSlug]/projects/[projectId]'>) {
    const { orgSlug, projectId } = await props.params;
    // ...
  }
  ```

  Prefer the generated `PageProps<'…'>` / `LayoutProps<'…'>` helpers over hand-written param types.

- **Intercepting + parallel routes** power the "open task in a modal over the list, deep-linkable, refresh = full page" pattern. The list lives at `…/tasks`, the modal is an `@modal` slot with `(.)t/[taskId]`, and the same route renders standalone when visited directly.
- **`loading.tsx`** is required on every dynamic data route to enable partial prefetching and instant navigation feedback.
- **URL is state.** Filters, sort, active tab, and pagination live in the query string (via `nuqs`), so views are shareable and back/forward works.
- **`<Link>` for all in-app navigation** (prefetch on by default). Use plain `<a>` only for external links. Disable prefetch (`prefetch={false}`) for very large link lists (e.g., infinite tables).

---

## 6. Layout Strategy

Layouts are nested and **preserve state across navigation** (they don't re-render on route change). We use this deliberately so the sidebar, org context, and scroll position survive transitions.

### Layout hierarchy

```
RootLayout (app/layout.tsx)
└── html/body · fonts · ThemeProvider · QueryProvider · Toaster
    ├── (auth)/layout.tsx        → AuthLayout (centered, no chrome)
    └── (app)/layout.tsx         → SessionGuard → AppShell
        └── [orgSlug]/layout.tsx → OrgProvider (org + RBAC context) + primary Sidebar nav
            └── [projectId]/layout.tsx → Project sub-nav (tabs)
```

### App shell anatomy

```
┌──────────────────────────────────────────────────────────────┐
│  Topbar: org switcher · global search (⌘K) · notifications · me │  56px, sticky
├───────────────┬──────────────────────────────────────────────┤
│  Sidebar      │  PageHeader: breadcrumbs · title · primary CTA  │
│  (collapsible │  ────────────────────────────────────────────  │
│   240/64px)   │  Page content (scroll container)                │
│               │                                                 │
└───────────────┴──────────────────────────────────────────────┘
```

- **Root layout** owns `<html>`/`<body>`, font variables, and the provider stack. It is the only place global providers mount.
- **AppShell** (`components/layout/app-shell.tsx`) renders the sidebar + topbar and a single scroll container for content. It's a Server Component where possible; interactive bits (collapse toggle, command menu) are isolated Client Components.
- **Sidebar** is collapsible (240px ↔ 64px icon rail). Collapse state persists to `localStorage` and is restored on mount to avoid layout shift.
- **PageHeader** is a shared primitive: breadcrumbs (left), title + optional description, and a right-aligned action area for the primary CTA. Every product page uses it for consistent rhythm.
- **Responsive:** sidebar becomes an off-canvas Sheet below `md`. Topbar stays sticky. Tables switch to stacked cards below `sm` (see §13).
- **Streaming:** wrap slow content regions in `<Suspense>` with skeletons; rely on `loading.tsx` at the segment level for route-wide fallback.

---

## 7. State Management

We classify state into four buckets and route each to a single tool. The goal: minimize client JS and avoid global stores for things that are really server data or URL state.

| State type | Examples | Tool | Rule |
| --- | --- | --- | --- |
| **Server state** | tasks, projects, members, audit log | **TanStack Query** | Source of truth is the API. Never copy into a store. |
| **URL state** | filters, sort, tab, page, search | **nuqs** (search params) | Shareable + back/forward correct. |
| **Local UI state** | open/closed, hover, input value | `useState`/`useReducer` | Keep it in the component. |
| **Global client state** | sidebar collapsed, command menu, theme | **Zustand** (small slices) / next-themes | Only when it must cross unrelated trees. |

### Guidelines

- **Default to the server.** Fetch in Server Components and pass data down. Reach for client state only at interactivity boundaries.
- **TanStack Query owns caching, retries, and invalidation.** Centralize a query-key factory in `lib/query/keys.ts` so invalidation is consistent:

  ```ts
  export const qk = {
    tasks: {
      list: (projectId: string, filters: TaskFilters) =>
        ['tasks', projectId, filters] as const,
      detail: (taskId: string) => ['tasks', 'detail', taskId] as const,
    },
  };
  ```

- **Mutations use optimistic updates** for high-frequency actions (status change, assignee, drag reorder) with rollback on error. After settle, invalidate the relevant list/detail keys.
- **No prop-drilling of server data through global stores.** If two distant components need the same server entity, they each call the same query hook — the cache dedupes the request.
- **Context is for stable, low-frequency values** (current org, current user, RBAC capabilities, theme). High-frequency values never go in Context (re-render storms).

---

## 8. API Layer Strategy

The backend is a FastAPI service (cookie/JWT session per the auth docs). The frontend talks to it through a **single typed client** plus thin per-feature endpoint modules. UI never calls `fetch` directly.

### Layers

```
UI / hooks (TanStack Query)
   └── features/<x>/api/<x>.api.ts      # endpoint functions, Zod-validated responses
        └── lib/api/client.ts            # typed fetch wrapper (auth, base URL, errors)
             └── FastAPI backend
```

### `lib/api/client.ts` responsibilities

- Resolve base URL from env (`NEXT_PUBLIC_API_URL` for client, internal URL for server).
- Attach credentials / auth headers; refresh-on-401 flow (single-flight refresh, then retry).
- Normalize errors into a typed `ApiError { status, code, message, details }`.
- Parse and **validate responses with Zod** at the boundary so the rest of the app trusts its types.
- Be usable from both Server Components (server fetch, no token leakage to client) and Client Components.

```ts
// features/tasks/api/tasks.api.ts
import { api } from '@/lib/api/client';
import { TaskSchema, TaskListSchema } from '../schemas/task.schema';

export const tasksApi = {
  list: (projectId: string, params: TaskListParams) =>
    api.get(`/projects/${projectId}/tasks`, { params, schema: TaskListSchema }),
  update: (taskId: string, body: UpdateTaskBody) =>
    api.patch(`/tasks/${taskId}`, { body, schema: TaskSchema }),
};
```

### Rules

- **Server-first fetching.** Read data in Server Components for first paint; use Query hooks for client-driven refetch, mutations, and live sections.
- **Secrets stay on the server.** API keys/tokens are read only in Server Components or Route Handlers, never shipped to the client.
- **BFF via Route Handlers** (`app/api/**/route.ts`) only when we must hide a secret, aggregate calls, or adapt a payload. Otherwise call the backend directly.
- **One error contract.** All endpoints surface `ApiError`; UI maps `code` → friendly message + recovery action.
- **DTOs in `types/`**, request/response schemas in each feature's `schemas/`. Types are *derived from* Zod schemas (`z.infer`) so validation and types never drift.

---

## 9. Theme System

Tailwind v4, **CSS-first**. All design tokens live as CSS custom properties in `app/globals.css` and are exposed to Tailwind via `@theme inline`. There is no `tailwind.config.js`. Dark mode is the default canvas; `next-themes` toggles a `.dark` class on `<html>`.

### How it works

- **Two token layers:**
  1. *Primitive/semantic CSS variables* (`--background`, `--primary`, `--border`, `--sidebar`, …) defined under `:root` (light) and `.dark` (dark).
  2. *Tailwind theme mapping* in `@theme inline` (`--color-background: var(--background)`, etc.) so utilities like `bg-background`, `text-muted-foreground`, `border-border` resolve to tokens.
- **Always use semantic tokens** (`bg-card`, `text-muted-foreground`, `border-border`) — never raw hex or one-off zinc shades in product code. This is what keeps light/dark parity automatic.
- **`@custom-variant dark`** is already wired; author dark overrides only where the semantic token isn't enough.
- **Theme provider** mounts in the root layout with `next-themes` (`attribute="class"`, `defaultTheme="dark"`, `enableSystem`). Add `suppressHydrationWarning` on `<html>`.

```tsx
// app/layout.tsx (provider stack)
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
  <QueryProvider>{children}<Toaster /></QueryProvider>
</ThemeProvider>
```

---

## 10. Color Palette

Authored in **OKLCH**. The existing repo ships a neutral monochrome set; this spec introduces a single **indigo accent** for the Linear-inspired identity while keeping surfaces neutral zinc. Values below are the target tokens for `globals.css` (dark = primary).

### Semantic tokens — Dark (primary)

| Token | OKLCH | Role |
| --- | --- | --- |
| `--background` | `oklch(0.145 0 0)` | App canvas (near-black zinc) |
| `--foreground` | `oklch(0.985 0 0)` | Primary text |
| `--card` / `--popover` | `oklch(0.205 0 0)` | Raised surfaces |
| `--muted` | `oklch(0.269 0 0)` | Subtle fills, hover |
| `--muted-foreground` | `oklch(0.708 0 0)` | Secondary text, metadata |
| `--border` | `oklch(1 0 0 / 10%)` | Hairline separators |
| `--input` | `oklch(1 0 0 / 15%)` | Field borders |
| `--primary` | `oklch(0.58 0.20 274)` | **Indigo accent** (CTAs, active nav, focus) |
| `--primary-foreground` | `oklch(0.985 0 0)` | Text on accent |
| `--ring` | `oklch(0.58 0.20 274 / 60%)` | Focus ring (accent-tinted) |
| `--sidebar` | `oklch(0.175 0 0)` | Sidebar surface (slightly off canvas) |

### Semantic tokens — Light (supported)

| Token | OKLCH | Role |
| --- | --- | --- |
| `--background` | `oklch(1 0 0)` | App canvas |
| `--foreground` | `oklch(0.145 0 0)` | Primary text |
| `--card` / `--popover` | `oklch(1 0 0)` | Surfaces |
| `--muted` | `oklch(0.97 0 0)` | Subtle fills |
| `--muted-foreground` | `oklch(0.556 0 0)` | Secondary text |
| `--border` / `--input` | `oklch(0.922 0 0)` | Borders |
| `--primary` | `oklch(0.50 0.21 274)` | Indigo accent (darker for contrast on white) |
| `--ring` | `oklch(0.50 0.21 274 / 50%)` | Focus ring |

### Status palette (semantic, both themes)

Used for badges, task states, approvals, governance results, toasts. Each has a foreground, a subtle background (`/10–/20` alpha), and a border tint.

| Status | Hue (OKLCH base) | Used for |
| --- | --- | --- |
| **Success** | `oklch(0.72 0.17 152)` (green) | Approved, passed policy, active flag |
| **Warning** | `oklch(0.80 0.16 85)` (amber) | Pending, needs review, expiring |
| **Destructive** | `oklch(0.70 0.19 22)` dark / `oklch(0.58 0.24 27)` light | Rejected, failed, delete |
| **Info** | `oklch(0.70 0.14 250)` (blue) | Informational, in-progress |
| **Neutral** | `--muted-foreground` | Draft, archived, disabled |

**Usage rules**

- Status colors signal *meaning*, never decoration. A green button is not "primary"; it's "this confirms a positive state change."
- Maintain **WCAG AA** (4.5:1 text, 3:1 large text/UI). Verify accent-on-surface pairs in both themes.
- Never rely on color alone — pair with an icon or label (see §18).

---

## 11. Typography

**Geist Sans** for UI, **Geist Mono** for code, IDs, and tabular figures. Loaded via `next/font/google` and exposed as `--font-sans` / `--font-mono` (already wired in the root layout and `@theme`).

### Type scale

| Token | Size / line-height | Weight | Use |
| --- | --- | --- | --- |
| `text-2xs` | 11px / 16px | 500 | Micro-labels, table column headers (uppercase, tracking) |
| `text-xs` | 12px / 16px | 400–500 | Metadata, timestamps, badges |
| `text-sm` | 14px / 20px | 400–500 | **Default body & UI text** |
| `text-base` | 16px / 24px | 400 | Long-form reading (descriptions, policy text) |
| `text-lg` | 18px / 28px | 500 | Card titles, section leads |
| `text-xl` | 20px / 28px | 600 | Page subsections |
| `text-2xl` | 24px / 32px | 600 | Page titles |
| `text-3xl` | 30px / 36px | 700 | Marketing / empty-state hero |

### Rules

- **14px is the default.** Dense enterprise UI reads at `text-sm`; reserve 16px for prose.
- **Weight, not size, for hierarchy.** Prefer `font-medium`/`font-semibold` shifts over jumping sizes.
- **Tracking:** slight negative tracking (`tracking-tight`) on titles ≥ `text-xl`; uppercase micro-labels use `tracking-wide`.
- **Tabular numbers** (`font-mono` or `tabular-nums`) for any aligned numeric column, counts, and IDs.
- **Color hierarchy:** primary text `text-foreground`, secondary `text-muted-foreground`. Don't introduce gray shades outside tokens.
- **Truncation:** single-line truncate in tables/lists with `title`/tooltip for the full value; never wrap IDs.

---

## 12. Spacing Scale

Tailwind's 4px base unit. We constrain usage to a predictable rhythm so screens feel consistent.

| Step | px | Primary use |
| --- | --- | --- |
| `0.5` | 2 | Icon nudges, hairline gaps |
| `1` | 4 | Badge padding, tight icon+label |
| `1.5` | 6 | Compact control inner spacing |
| `2` | 8 | Default gap between related controls |
| `3` | 12 | Input padding, list row gaps |
| `4` | 16 | **Card padding, default block spacing** |
| `6` | 24 | Section spacing within a page |
| `8` | 32 | Between major sections |
| `12` | 48 | Page top padding / large separations |
| `16` | 64 | Empty-state / centered layouts |

### Rules

- **Density tiers:** *Comfortable* (default, row height ~44px) and *Compact* (tables/power users, row height ~36px). Pick per surface; don't mix within one table.
- **Page gutter:** content area uses `px-6 py-6` (desktop), `px-4 py-4` (mobile).
- **Card internals:** `p-4` standard; `p-6` for spacious detail cards. Header/body/footer separated by `gap-4`.
- **Vertical rhythm:** stack sections with `space-y-6`; within a section use `space-y-4`.
- Avoid arbitrary values (`gap-[13px]`). If you need a new step, justify it here first.

---

## 13. Border Radius Scale

Driven by a single `--radius` base (currently `0.625rem` / 10px) with the multiplier scale already defined in `globals.css`. Keep it.

| Token | Computed | Use |
| --- | --- | --- |
| `rounded-sm` (`--radius-sm`) | `calc(radius × 0.6)` ≈ 6px | Badges, tags, small inputs, menu items |
| `rounded-md` (`--radius-md`) | `calc(radius × 0.8)` ≈ 8px | Buttons, inputs, dropdowns |
| `rounded-lg` (`--radius-lg`) | `radius` = 10px | **Cards, popovers, dialogs (default surface radius)** |
| `rounded-xl` (`--radius-xl`) | `calc(radius × 1.4)` ≈ 14px | Large modals, prominent panels |
| `rounded-2xl`+ | `× 1.8`+ | Marketing, hero, illustration containers |
| `rounded-full` | — | Avatars, pills, icon-only toggle buttons |

### Rules

- **Surfaces are `rounded-lg`; interactive controls are `rounded-md`.** This contrast (slightly tighter controls inside slightly softer cards) is core to the Linear-clean feel.
- Nested elements step *down* one level from their container so corners stay visually concentric.
- Avatars and status dots are `rounded-full`. Pills (filters, counts) are `rounded-full` for small, `rounded-md` for larger.
- Never hardcode pixel radii; always use the token scale so global tuning stays one variable.

---

## 14. Component Standards

We **own** our components in-repo under `components/ui` using the ShadCN `radix-nova` pattern: `cva` for variants, `data-slot`/`data-variant` attributes for styling hooks, Radix primitives for behavior, and `cn()` for class merging. The existing `Button` is the reference implementation.

### Authoring rules

1. **Variants via CVA.** Define `variant` and `size` in a `cva()` block with `defaultVariants`. Expose `VariantProps<typeof xVariants>`.
2. **`data-slot` on every root.** Enables consistent, scoped styling and testing hooks (e.g., `data-slot="button"`).
3. **`asChild` for composition.** Use Radix `Slot` so a component can render as a `<Link>` or other element without wrapper divs.
4. **Spread native props + `className`.** Always accept `className` last into `cn()` so callers can extend.
5. **Server by default.** A primitive is a Server Component unless it needs state/handlers; add `'use client'` only then, at the smallest scope.
6. **Forward refs / typed props.** Use `React.ComponentProps<'el'>` for the base element prop types.
7. **Icons:** Lucide, `size-4` default in `text-sm` contexts; never set color via the icon, inherit from text.

```tsx
// Variant API contract example (mirrors components/ui/button.tsx)
<Button variant="default" size="sm">Save</Button>
<Button variant="outline" size="icon-sm" aria-label="More"><MoreHorizontal /></Button>
<Button variant="destructive">Delete</Button>
<Button asChild><Link href="/...">Open</Link></Button>
```

### Component states (every interactive component must define all)

`default · hover · active · focus-visible · disabled · loading · aria-invalid · selected/expanded`

- **Focus** is always visible via `focus-visible:ring-3 ring-ring/50` — never removed.
- **Loading** disables interaction and shows a spinner or skeleton; never a dead button.
- **Invalid** uses `aria-invalid` styling (destructive ring), not ad-hoc red borders.

### Inventory (build order, all on the token system)

Button · Input · Textarea · Select · Combobox · Checkbox · Radio · Switch · Label · Badge · Avatar · Tooltip · Dropdown Menu · Context Menu · Dialog · Sheet · Popover · Tabs · Toast (Sonner-style) · Skeleton · Card · Separator · Breadcrumb · Pagination · Command (⌘K) · Table primitives · Calendar/Date picker.

---

## 15. Navigation Standards

Navigation is keyboard-first and predictable. Three layers: **global**, **primary**, **contextual**.

- **Global (Topbar):** org switcher (left), command palette trigger + global search (`⌘K`/`Ctrl+K`, center), notifications + user menu (right). Sticky, 56px.
- **Primary (Sidebar):** top-level destinations scoped to the current org — Dashboard, Projects, Teams, Approvals, Governance, Activity, Settings. Collapsible to a 64px icon rail.
- **Contextual (Tabs/sub-nav):** within an entity (e.g., a Project → Overview / Tasks / Settings) rendered by that segment's `layout.tsx`.

### Rules

- **Active state** uses the accent: filled/tinted background + accent text + a left indicator on the sidebar item. Derive active from `usePathname()`; match by segment, not exact string, so nested routes keep the parent highlighted.
- **`<Link>` everywhere** for internal nav (prefetch on). Breadcrumbs reflect the route hierarchy and are generated from the segment tree, last crumb non-clickable.
- **Command palette** is a first-class navigator: jump to entities, run actions, switch org/theme. It's the power-user path Linear users expect.
- **Keyboard:** `⌘K` palette, `g` then `p`/`t` style "go to" shortcuts, `/` to focus search, `Esc` closes overlays, arrow keys in menus/lists. All shortcuts discoverable in the palette.
- **Mobile:** sidebar collapses into an off-canvas `Sheet`; topbar persists; bottom-safe spacing respected.
- **Breadcrumb + page title** always answer "where am I and what is this?" on every product page via `PageHeader`.

---

## 16. Table Design Standards

Tables are the workhorse of Structra (task lists, members, audit logs, flags). Built on **TanStack Table** (headless) styled with our `components/data/data-table` primitives. Jira-level capability, Notion-level calm.

### Anatomy & behavior

- **Header row:** `text-2xs` uppercase, `text-muted-foreground`, `tracking-wide`, sticky on vertical scroll. Sortable columns show a chevron on hover/active.
- **Rows:** `text-sm`, ~36px (compact) or ~44px (comfortable). Hairline `border-border` row separators only — no heavy grid lines. Hover raises with `bg-muted/50`. Full-row click navigates; interactive cells stop propagation.
- **Cells:** left-align text, **right-align numerics** with `tabular-nums`, center-align status/icons. Truncate long text with tooltip; never wrap IDs.
- **Selection:** leading checkbox column; selecting rows reveals a **bulk-action bar** (sticky, replaces or overlays the toolbar) showing count + actions (assign, move, delete, export).
- **Density toggle:** comfortable/compact, persisted per table.
- **Column controls:** show/hide, reorder, resize, pin (pin selection + key identity columns left). Persist layout per user per table.

### Toolbar (above table)

`[ search ] [ filter chips ] [ sort ] ........ [ density ] [ columns ] [ primary action ]`

- Filters and sort write to the **URL** (`nuqs`), so a filtered view is shareable.
- Filter chips are removable pills; "Clear all" appears when any filter is active.

### States

- **Loading:** skeleton rows matching column layout (via `loading.tsx` / Suspense), not a spinner blocking the whole page.
- **Empty:** `EmptyState` with icon, one-line explanation, and a primary action (e.g., "Create task"). Distinguish *no data yet* from *no results for filters* (the latter offers "Clear filters").
- **Error:** inline `ErrorState` with retry; keep toolbar usable.
- **Pagination:** prefer cursor-based "Load more"/infinite for activity/audit feeds; page-number pagination for finite admin lists. Show total when cheaply available.

### Accessibility

Use semantic `<table>`/`<th scope>`; sortable headers are buttons with `aria-sort`; selection checkboxes have labels; row actions reachable by keyboard.

---

## 17. Form Design Standards

Forms use **React Hook Form** + **Zod** (`zodResolver`). Validation schemas live in each feature's `schemas/`, shared with the API layer so client and server agree.

### Layout & structure

- **Single column** by default; group related fields with `FormSection` (title + description + fields). Two-column only for short, paired fields (e.g., first/last) on wide screens.
- **Label above input.** Required fields marked with a subtle indicator; optional fields say "(optional)" rather than marking everything required.
- **Help text** sits below the field in `text-xs text-muted-foreground`. Error text replaces help text in destructive color when present.
- **Field width matches expected content** (a status select shouldn't be full-width on a wide form).

### Validation & feedback

- **Validate on submit, then on change** for fields that have already errored (`mode: 'onTouched'`), so users aren't yelled at while typing.
- **Field errors** use `aria-invalid` + the destructive ring + a message tied via `aria-describedby`. Never rely on color alone.
- **Submit button:** disabled + spinner while pending; shows the action verb ("Create project"), not "Submit". Disable double-submit.
- **Server errors** map back to fields when the API returns field-level errors; otherwise show a form-level alert at the top.
- **Destructive actions** (delete org/project, revoke role) require a confirm dialog; high-risk ones require typing the entity name to confirm.

### Patterns

- **Sheets/dialogs for create/edit** of single entities; full pages for complex multi-section config (governance policy editor, RBAC matrix).
- **Autosave** for settings-style forms (debounced, with a quiet "Saved" indicator); explicit Save for creation flows.
- **Unsaved-changes guard** when navigating away from a dirty form.
- **Keyboard:** `⌘/Ctrl+Enter` submits; `Esc` closes the sheet/dialog (with dirty-check).

---

## 18. Accessibility Standards

Accessibility is a requirement, not a pass. Target **WCAG 2.1 AA**.

- **Color contrast:** 4.5:1 for normal text, 3:1 for large text and UI/graphical elements, in **both** themes. Verify accent and status pairings against their surfaces.
- **Never color-only:** status is always color **plus** icon/label. Charts use patterns/labels, not hue alone.
- **Keyboard:** every interactive element reachable and operable by keyboard in a logical tab order. Visible `focus-visible` ring always present. No keyboard traps; overlays trap focus *while open* and restore focus on close.
- **Semantics first:** use real elements (`button`, `a`, `table`, `nav`, `ul`). Reach for ARIA only to fill gaps. Radix primitives give us correct roles/states for menus, dialogs, tabs, tooltips.
- **Labels:** every input has a programmatic label; icon-only buttons have `aria-label`. Form errors associated via `aria-describedby`; `aria-invalid` on the field.
- **Live regions:** toasts and async results announce via `aria-live="polite"`; destructive confirmations are `role="alertdialog"`.
- **Motion:** respect `prefers-reduced-motion` — disable non-essential transitions. Keep functional motion ≤ 200ms.
- **Targets:** minimum 24×24px hit area (prefer ≥ 32px) even in compact density; pad with hit-area where the visual is smaller.
- **Headings/landmarks:** one `h1` per page (the page title); logical heading order; `main`, `nav`, `header` landmarks in the shell.
- **Tooling:** `eslint-plugin-jsx-a11y` in CI; `axe` checks in component tests. Manual screen-reader and keyboard passes for new flows.

> Full WCAG conformance can't be proven by automation alone — automated checks catch a subset. New flows get a manual keyboard + screen-reader review and expert sign-off before they ship.

---

## 19. Conventions & Appendix

### Naming

- **Files/folders:** `kebab-case` (`task-detail-sheet.tsx`, `use-tasks.ts`).
- **Components:** `PascalCase`. **Hooks:** `useThing`. **Types/Schemas:** `PascalCase` (`Task`, `TaskSchema`).
- **Query keys:** centralized factory (`lib/query/keys.ts`). **Routes:** lowercase, hyphenated segments.

### Server vs Client checklist

Add `'use client'` only when you need state, effects, event handlers, or browser APIs. Push the boundary as deep as possible — a Server page rendering a small Client island beats a Client page.

### Definition of Done (UI work)

- [ ] Uses semantic tokens (no raw colors), correct radius/spacing steps.
- [ ] Works in **dark and light**; contrast verified.
- [ ] All interactive states defined (hover/focus-visible/disabled/loading/invalid).
- [ ] Keyboard operable; focus visible; labels/`aria-*` present.
- [ ] Loading (`loading.tsx`/skeleton), empty, and error states handled.
- [ ] Server/Client boundary minimal; data via Query/server fetch, filters in URL.
- [ ] `lint` (incl. `jsx-a11y`) and type-check pass.

### Open items / future

- Tokenize the indigo accent into `globals.css` (currently monochrome) — see §10.
- Add `next-themes`, TanStack Query/Table, RHF + Zod, nuqs to `package.json`.
- Chart system (governance/activity dashboards) — define on top of the same token palette.
- Internationalization approach (deferred; design copy with extraction in mind).
```
