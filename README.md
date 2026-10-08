# DeckLog PMS

DeckLog PMS is a portfolio-ready planned maintenance system for a merchant navy vessel. It models the workflow a deck or engine officer uses to monitor equipment, plan jobs, assign crew, handle overdue work, and review readiness.

## Features

- Vessel dashboard for MV Ardent Horizon
- Open, overdue, scheduled, in-progress, and completed work orders
- Search and status filtering across the maintenance queue
- Work-order detail drawer with start and complete actions
- New work-order form with assignment, priority, equipment, and due date
- Equipment readiness register with health scores and service outlook
- Crew maintenance workload view
- Maintenance performance report with trend chart
- CSV export for work orders
- Local browser persistence using `localStorage`
- Responsive layout with mobile navigation

## Project documentation

- [Business Requirements Document (BRD)](./docs/BRD.md)
- [Functional Requirements Document (FRD)](./docs/FRD.md)
- [Software Requirements Specification (SRS)](./docs/SRS.md)
- [Technical Design & Implementation (TDI)](./docs/TDI.md)
- [Production Deployment Guide](./docs/PRODUCTION-DEPLOYMENT.md)

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

## Resume description

> Built a responsive planned maintenance system for merchant navy operations using React, TypeScript, and Vite. Implemented work-order scheduling, overdue alerts, equipment health monitoring, crew assignment, local persistence, CSV reporting, and responsive dashboard workflows.

## Next production modules

- Role-based access for Chief Engineer, Chief Officer, and Superintendent
- Supabase/PostgreSQL persistence and audit history
- Spare-parts inventory and purchase requests
- Maintenance attachments and inspection sign-off
- Offline-first synchronization for shipboard connectivity
