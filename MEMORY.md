# Pharma Field App — Project Memory

## Project Overview

**Type:** Mobile-first Progressive Web App (PWA)  
**Purpose:** Pharma Field Force Management — field employees log visits, attendance, daily reports  
**Location:** `/Users/paraslohia/pharma-field-app`  
**Backend:** `/Users/paraslohia/pharma-field-api` (NestJS + PostgreSQL, runs on `:3000`)

---

## Tech Stack

| Tool | Version | Notes |
|------|---------|-------|
| React | 19 | With lazy loading for all pages |
| TypeScript | 5.7 | `verbatimModuleSyntax: true` — all type imports must use `import type` |
| Vite | 8 | Dev proxy `/api` → `http://localhost:3000` |
| Tailwind CSS | **v4** | No `tailwind.config.js`; uses `@import "tailwindcss"` in CSS; plugin: `@tailwindcss/vite` |
| TanStack Query | latest | `staleTime: 30_000`, retry: 1 |
| Zustand | latest | Auth store persisted as `pharma-auth` in localStorage |
| React Router DOM | latest | BrowserRouter with lazy Suspense |
| React Hook Form + Zod | latest | `zodResolver` on all forms |
| Axios | latest | Auto token-refresh interceptor in `src/api/axios.ts` |
| Lucide React | latest | Icons throughout |
| React Hot Toast | latest | Top-center toasts |
| Vite PWA Plugin | latest | `registerType: autoUpdate`, service worker generated at build |
| dayjs | latest | Date formatting (default import, not `* as dayjs`) |

---

## Running the App

```bash
# Development
cd /Users/paraslohia/pharma-field-app
npm run dev          # http://localhost:5173

# Production build
npm run build        # zero TS errors, generates dist/ + sw.js

# Backend must also be running
cd /Users/paraslohia/pharma-field-api
npm run start:dev    # http://localhost:3000
```

**Default login:** `admin@pharmafield.com` / `Admin@123`

---

## Project Structure

```
src/
├── api/              # Axios instance + per-module API functions
│   ├── axios.ts      # Base instance with auth interceptor + token refresh
│   ├── auth.ts
│   ├── users.ts
│   ├── territories.ts
│   ├── doctors.ts
│   ├── chemists.ts
│   ├── attendance.ts
│   ├── visits.ts
│   ├── dailyReports.ts
│   └── dashboard.ts
├── components/
│   ├── common/       # Button, Input, Textarea, Select, Badge, Card, Modal
│   ├── feedback/     # Skeleton, EmptyState, ErrorMessage
│   ├── mobile/       # BottomSheet
│   ├── navigation/   # BottomNav (mobile), Sidebar (desktop)
│   └── layout/       # AppLayout, TopBar
├── features/
│   ├── auth/         # LoginPage, SettingsPage
│   ├── dashboard/    # DashboardPage (admin + employee views)
│   ├── attendance/   # AttendancePage (GPS check-in/out, history)
│   ├── doctors/      # DoctorsPage, DoctorDetailPage, DoctorFormPage
│   ├── chemists/     # ChemistsPage, ChemistDetailPage, ChemistFormPage
│   ├── visits/       # VisitsPage, VisitDetailPage, VisitFormPage
│   ├── dailyReports/ # DailyReportsPage, DailyReportDetailPage, DailyReportNewPage
│   ├── users/        # UsersPage, UserDetailPage, UserFormPage (admin only)
│   └── territories/  # TerritoriesPage (admin only, hierarchy tree)
├── hooks/            # (reserved for custom hooks)
├── routes/           # ProtectedRoute, AdminRoute, GuestRoute
├── store/            # authStore.ts (Zustand)
├── types/            # api.ts (all TypeScript types from API contract)
└── App.tsx           # Router + QueryClient + Toaster
```

---

## Key Architectural Decisions

### Auth Flow
- JWT access token (15min) + refresh token (30 days)
- Both stored in `localStorage` AND Zustand persisted store
- Axios interceptor auto-refreshes on 401, queues concurrent requests
- `GuestRoute` redirects authenticated users away from `/login`
- `AdminRoute` restricts SUPER_ADMIN + ADMIN only pages

### Roles
```
SUPER_ADMIN → full access
ADMIN       → full access
MR          → own visits/reports only, no users/territories management
SALES_PERSON → same as MR
```

### State Management
- **Server state:** TanStack Query (API calls, caching, invalidation)
- **Client state:** Zustand auth store only
- Query keys follow pattern: `['resource', 'sub-type', filters]`

### Navigation
- **Mobile (< lg):** Bottom navigation bar (5 tabs, role-dependent) + TopBar with back button
- **Desktop (≥ lg):** Left sidebar with all nav links + user info

---

## Important TypeScript Rules

```typescript
// REQUIRED: verbatimModuleSyntax is enabled
import { type ReactNode } from 'react';       // ✅
import { type AxiosError } from 'axios';       // ✅
import type { User } from '@/types/api';       // ✅
import { ReactNode } from 'react';             // ❌ will error

// Path alias works
import { Button } from '@/components/common/Button';
```

tsconfig has `"ignoreDeprecations": "6.0"` to allow `baseUrl` + `paths` aliases.

---

## Tailwind CSS v4 Rules

```css
/* src/index.css */
@import "tailwindcss";    /* replaces @tailwind base/components/utilities */

@theme {
  --color-primary-500: #3b82f6;  /* custom tokens */
}
```

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
plugins: [react(), tailwindcss(), ...]
```

**No** `tailwind.config.js`, **no** `postcss.config.js` needed.

---

## API Contract

All 47 endpoints documented in `/Users/paraslohia/pharma-field-api/API_CONTRACT.md`

Base URL: `http://localhost:3000/api/v1`  
Swagger: `http://localhost:3000/api/docs`

Response envelope:
```json
{ "success": true, "data": { ... } }
{ "success": true, "data": [...], "meta": { "total", "page", "limit", "totalPages" } }
```

---

## Modules Status

| Module | Pages | Status |
|--------|-------|--------|
| Auth | Login, Settings, Change Password | ✅ Complete |
| Dashboard | Admin KPIs, Employee personal | ✅ Complete |
| Attendance | Check-in/out (GPS), History, Admin list | ✅ Complete |
| Doctors | List, Detail, Add, Edit | ✅ Complete |
| Chemists | List, Detail, Add, Edit | ✅ Complete |
| Visits | List (today/all/followups), Detail, Create, Edit | ✅ Complete |
| Daily Reports | List, Detail/Edit, Create, Submit | ✅ Complete |
| Users | List, Detail, Add, Edit, Toggle Active | ✅ Complete |
| Territories | Hierarchy tree, Add State/District/City/Territory | ✅ Complete |

---

## PWA Config

- **Manifest:** `name: Pharma Field Force`, `display: standalone`, `orientation: portrait`
- **Icons:** Need `public/icons/icon-192.png` and `public/icons/icon-512.png`
- **Service Worker:** `registerType: autoUpdate`, caches all assets + API responses (5min TTL)
- **Offline:** API calls use `NetworkFirst` strategy

---

## Known Issues / TODOs

- PWA icons (`public/icons/icon-192.png`, `icon-512.png`) need to be created/added
- Admin attendance list currently shows `daily-present` endpoint (today only); full list filter UI can be added
- Territory assignment to users (UI for assigning territories to employees from user detail page)
