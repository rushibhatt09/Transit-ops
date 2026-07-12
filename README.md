# TransitOps

A fleet operations platform for logistics companies — vehicles, drivers, trip dispatching, maintenance, and fuel/expense tracking in one place, instead of spreadsheets and paper logbooks.

Four people use it day to day: a **Fleet Manager** who owns the vehicles and maintenance schedule, a **Driver/dispatcher** who books and runs trips, a **Safety Officer** who watches license compliance and safety scores, and a **Financial Analyst** who cares about cost and ROI per vehicle.

## Stack

- **API:** Node, Express, TypeScript, Prisma, SQLite, JWT auth
- **Web:** React, Vite, TypeScript, Tailwind, Recharts, Framer Motion

SQLite keeps setup to `npm install` and a migrate command — no Postgres instance to stand up just to try the app out. Swapping to a "real" database later is a one-line change in `schema.prisma`.

## Running it locally

```bash
npm install
cp server/.env.example server/.env
npm run --workspace=server prisma:migrate
npm run seed
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Log in with any of these (password `password123` for all of them) — the login screen also has one-click buttons for each:

| Role | Email |
|---|---|
| Fleet Manager | fleet.manager@transitops.com |
| Driver | driver@transitops.com |
| Safety Officer | safety.officer@transitops.com |
| Financial Analyst | finance.analyst@transitops.com |

The seed data is a small but active fleet — 14 vehicles across four regions, 10 drivers (one suspended, one with an expired license, on purpose, to show the compliance checks working), and about 60 trips spread over the last couple of months so the dashboard and reports have something real to show rather than empty charts. Run `npm run seed` again any time to reset back to that state.

## What it does

Vehicle registry and driver profiles with full CRUD, a trip flow that goes Draft → Dispatched → Completed/Cancelled, a maintenance workflow, fuel and expense logging, and a reports page with fuel efficiency / utilization / operational cost / ROI per vehicle plus CSV export.

The business rules from the brief are enforced on the server, not just hinted at in the UI:

- Registration numbers are unique
- Retired or in-shop vehicles never show up as dispatch options
- A driver with an expired license or a suspended status can't be assigned
- A vehicle or driver already on a trip can't be double-booked
- Cargo weight is checked against the vehicle's max load before a trip can be created or dispatched
- Dispatch flips both vehicle and driver to "On Trip"; completing or cancelling flips them back
- Opening a maintenance record locks the vehicle to "In Shop"; closing it (if nothing else is still open) releases it back to "Available", unless the vehicle's retired

Beyond the core requirements: dark mode, a notification bell for licenses expiring within 30 days (with a "send reminder" action that logs what would go out by email), search/filter/sort on every table, a document-link field on vehicles for RC/insurance/permit references, and charts wired into both the dashboard and the reports page.

Didn't get to: real outbound email (the reminder logic is there, it just logs instead of hitting an SMTP server) and PDF export, since CSV covers the actual requirement and PDF was marked optional.

## Layout

```
server/
  prisma/schema.prisma   data model
  prisma/seed.ts         demo data
  src/routes/            one file per resource
  src/middleware/        auth, RBAC, error handling
client/
  src/pages/             one page per feature area
  src/components/        shared UI (Layout, Modal, StatCard, ...)
  src/context/           auth + dark mode state
```

## API

Everything lives under `/api` and needs `Authorization: Bearer <token>`, except login itself.

| Resource | Routes |
|---|---|
| Auth | `POST /auth/login`, `GET /auth/me` |
| Vehicles | `GET/POST /vehicles`, `GET/PUT/DELETE /vehicles/:id` |
| Drivers | `GET/POST /drivers`, `GET/PUT/DELETE /drivers/:id` |
| Trips | `GET/POST /trips`, `POST /trips/:id/dispatch`, `/complete`, `/cancel` |
| Maintenance | `GET/POST /maintenance`, `POST /maintenance/:id/close` |
| Fuel logs | `GET/POST /fuel-logs` |
| Expenses | `GET/POST /expenses` |
| Dashboard | `GET /dashboard?type=&region=` |
| Reports | `GET /reports`, `GET /reports/export` |
| Notifications | `GET /notifications/license-expiry`, `POST /notifications/license-expiry/send` |
