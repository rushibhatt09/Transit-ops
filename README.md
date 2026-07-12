# TransitOps — Smart Transport Operations Platform

An end-to-end transport operations platform that digitizes vehicle, driver, dispatch,
maintenance, and expense management for logistics fleets — built for an 8-hour hackathon.

Replaces spreadsheets/logbooks with a single system that enforces business rules
(license validity, load capacity, double-booking, maintenance lockouts) and gives
Fleet Managers, Drivers, Safety Officers, and Financial Analysts role-appropriate
visibility into operations.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma ORM, SQLite, JWT auth, Zod validation
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Axios
- **Auth:** Email/password login, JWT bearer tokens, Role-Based Access Control (RBAC)

SQLite was chosen so the app runs with zero external setup — no database server to
install or configure. Swapping to Postgres/MySQL only requires changing `DATABASE_URL`
and the `provider` in `server/prisma/schema.prisma`.

## Quick Start

Prerequisites: Node.js 18+.

```bash
# 1. Install all dependencies (root workspace covers both server & client)
npm install

# 2. Configure the server environment
cp server/.env.example server/.env

# 3. Create the database schema and seed demo data
npm run --workspace=server prisma:migrate
npm run seed

# 4. Run both apps (in two terminals)
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Open http://localhost:5173 — the login page lists demo accounts you can click to
autofill.

### Demo accounts (password: `password123`)

| Role | Email |
|---|---|
| Fleet Manager | fleet.manager@transitops.com |
| Driver | driver@transitops.com |
| Safety Officer | safety.officer@transitops.com |
| Financial Analyst | finance.analyst@transitops.com |

Re-run `npm run seed` at any time to reset to a clean demo dataset (6 vehicles across
4 regions, 5 drivers including one suspended and one with an expired license, and a
trip in every lifecycle state).

## Feature Coverage

### Functional Requirements
- [x] **Authentication** — email/password login, JWT, RBAC (4 roles), all routes protected
- [x] **Dashboard** — Active/Available Vehicles, In Maintenance, Active/Pending Trips,
      Drivers On Duty, Fleet Utilization %, filterable by vehicle type & region
- [x] **Vehicle Registry** — unique registration number, model/type/capacity/odometer/cost,
      status lifecycle (Available/On Trip/In Shop/Retired), search/filter/sort
- [x] **Driver Management** — license number/category/expiry, contact, safety score,
      status (Available/On Trip/Off Duty/Suspended)
- [x] **Trip Management** — Draft → Dispatched → Completed → Cancelled lifecycle with
      full validation
- [x] **Maintenance** — creating a record locks the vehicle to "In Shop"; closing it
      restores availability
- [x] **Fuel & Expense Management** — fuel logs, toll/other expenses, automatic
      operational cost roll-up per vehicle
- [x] **Reports & Analytics** — Fuel Efficiency, Fleet Utilization, Operational Cost,
      Vehicle ROI, CSV export

### Mandatory Business Rules (all enforced server-side)
- [x] Registration numbers are unique (DB constraint + friendly 409 error)
- [x] Retired/In Shop vehicles never appear in the dispatch pool (`/vehicles?status=AVAILABLE`)
- [x] Expired-license or Suspended drivers cannot be assigned to trips
- [x] A vehicle/driver already On Trip cannot be double-booked
- [x] Cargo weight is validated against the vehicle's max load capacity
- [x] Dispatch → vehicle + driver flip to On Trip; Complete/Cancel → flip back to Available
- [x] Creating a maintenance record flips the vehicle to In Shop; closing it (with no
      other open records) restores Available — unless the vehicle is Retired

### Bonus Features Implemented
- [x] CSV export for reports
- [x] Charts & visual analytics (fleet status pie chart, utilization/ROI/fuel-efficiency bar charts)
- [x] Dark mode (persisted, system-preference aware)
- [x] Search, filter, and column sorting on all list views
- [x] Vehicle document management (document URL field for RC/insurance/permit links)
- [x] License-expiry reminders — a notification bell surfaces drivers expiring within
      30 days; a "send reminder" endpoint simulates the email dispatch (logged
      server-side, since no SMTP relay is available in this environment)

Not implemented (time-boxed out for the 8-hour format): PDF export (CSV covers the
mandatory export requirement; PDF was explicitly optional in the brief), and real
outbound email delivery (the reminder pipeline is fully wired — swapping in
`nodemailer` + SMTP credentials in `server/src/routes/notifications.ts` is a small
follow-up).

## Architecture Notes

- **Monorepo** via npm workspaces: `server/` (API) and `client/` (SPA), independently
  runnable.
- **RBAC matrix:** Fleet Managers have full write access to vehicles/drivers/maintenance;
  Drivers can create/dispatch/complete/cancel trips and log fuel; Safety Officers can
  update driver safety scores/status; Financial Analysts own fuel logs and expenses.
  All roles have read access across the app so every persona can monitor operations,
  matching the brief's description of each role's oversight responsibilities.
- **Trip lifecycle locking:** vehicle/driver availability is only locked at *dispatch*
  time (not draft creation), so multiple drafts can reference the same vehicle but only
  one can actually be dispatched — the second dispatch attempt fails validation with a
  clear error, mirroring how a real dispatcher would triage.
- **SQLite + Prisma:** enums aren't supported by SQLite in Prisma, so status/role fields
  are typed as `String` in `schema.prisma` and constrained via Zod at the API boundary
  (see comment at the top of the schema file for the allowed value sets).

## Project Structure

```
server/
  prisma/schema.prisma   # data model
  prisma/seed.ts          # demo data
  src/routes/             # one file per resource (auth, vehicles, drivers, trips, ...)
  src/middleware/          # JWT auth, RBAC, error handling
  src/index.ts             # Express app entry point
client/
  src/pages/               # one page per feature area
  src/components/          # Layout, Modal, StatCard, StatusBadge, shared UI classes
  src/context/             # Auth + Theme (dark mode) providers
  src/lib/api.ts           # Axios instance with auth interceptor
```

## API Overview

All routes are under `/api` and require `Authorization: Bearer <token>` except
`POST /api/auth/login`.

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `GET /auth/me` |
| Vehicles | `GET/POST /vehicles`, `GET/PUT/DELETE /vehicles/:id` |
| Drivers | `GET/POST /drivers`, `GET/PUT/DELETE /drivers/:id` |
| Trips | `GET/POST /trips`, `GET /trips/:id`, `POST /trips/:id/dispatch`, `/complete`, `/cancel` |
| Maintenance | `GET/POST /maintenance`, `POST /maintenance/:id/close` |
| Fuel Logs | `GET/POST /fuel-logs` |
| Expenses | `GET/POST /expenses` |
| Dashboard | `GET /dashboard?type=&region=` |
| Reports | `GET /reports`, `GET /reports/export` (CSV) |
| Notifications | `GET /notifications/license-expiry`, `POST /notifications/license-expiry/send` |
