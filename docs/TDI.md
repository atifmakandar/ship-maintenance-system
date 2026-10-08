# Technical Design & Implementation Document (TDI)

## 1. Document control

| Field | Value |
|---|---|
| Project | DeckLog PMS — Planned Maintenance System |
| Version | 1.0 |
| Status | MVP / Portfolio Release |
| Related documents | [BRD](./BRD.md), [FRD](./FRD.md), [SRS](./SRS.md) |

## 2. Technical summary

DeckLog PMS is a single-page React application built with TypeScript and Vite. The MVP is intentionally client-side so it can be deployed as a static site and demonstrated without a backend. The UI uses a navy, teal, and warm neutral design system intended to feel like an operational maritime control desk.

## 3. Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| UI | React 19 | Component-based interface and rendering. |
| Language | TypeScript 5.7 | Static typing for UI state and domain records. |
| Build | Vite 6 | Development server and production bundling. |
| Icons | Lucide React | Consistent line icons for operations UI. |
| Styling | CSS | Responsive layout, visual states, and design tokens. |
| Persistence | Browser `localStorage` | MVP work-order persistence. |
| Export | Browser Blob/download API | CSV report generation. |
| Fonts | DM Sans, Manrope, DM Mono | UI, headings, and operational metadata. |
| Hosting target | Vercel/static host | Serves the `dist` directory. |

## 4. Repository structure

```text
ship-maintenance-system/
├── docs/
│   ├── BRD.md
│   ├── FRD.md
│   ├── SRS.md
│   └── TDI.md
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 5. Component architecture

The current MVP uses `src/App.tsx` as the application shell and domain workflow module. The following logical components are implemented in that file:

| Component | Responsibility |
|---|---|
| `App` | Global state, navigation, persistence, modals, and top-level layout. |
| `Dashboard` | Metrics, maintenance queue, readiness summary, and recent orders. |
| `MetricCard` | Reusable operational KPI card. |
| `QueueItem` | Clickable maintenance queue row. |
| `WorkOrders` | Full work-order management view and filters. |
| `WorkOrderTable` | Tabular work-order rendering and row actions. |
| `EquipmentView` | Asset register, vessel position card, and service outlook. |
| `EquipmentCard` | Equipment health and service card. |
| `CrewView` | Crew availability and open-task counts. |
| `ReportsView` | Readiness, completion metrics, and trend visualization. |
| `JobDetailModal` | Work-order details, progress, start, complete, and reopen actions. |
| `NewJobModal` | New work-order form. |
| `NewEquipmentModal` | New asset registration form. |

For a larger production codebase, these components should be split into `components/`, domain hooks, and service modules.

## 6. State management design

### Application state

```text
activeSection       Current navigation section
jobs                Current MaintenanceJob[] state
equipmentItems      Current Equipment[] state
search              Global work-order search value
filter              Current status filter
showNewJob          New work-order modal state
showNewEquipment    New asset modal state
selectedJobId       Detail modal selection
showNotifications   Notification popover state
toast               Temporary user feedback message
mobileMenu          Mobile sidebar state
```

### Derived state

- `stats.open`: jobs whose status is not Completed.
- `stats.overdue`: jobs with Overdue status.
- `stats.dueSoon`: Scheduled plus In progress jobs.
- `stats.completed`: jobs with Completed status.
- `visibleJobs`: filter and search result set.
- crew open-task counts: current jobs grouped by assignee.
- report completion rate: completed jobs divided by total jobs.

## 7. Data flow

```text
User interaction
      │
      ▼
React event handler
      │
      ├── setJobs / setEquipmentItems
      ├── setSelectedJobId / modal state
      ├── create CSV Blob for export
      └── setToast for feedback
      │
      ▼
React re-render
      │
      ▼
useEffect → localStorage for work orders
```

## 8. Work-order status model

```text
Scheduled ───────────────► In progress ───────────────► Completed
    │                            │                         │
    └──────────────► Overdue     └──────────────► Completed │
                                                             │
Completed ─────────────────────────────────────────► Scheduled
```

The MVP allows completion from the queue/table shortcut and provides explicit Start job, Mark complete, and Reopen task actions inside the detail modal.

## 9. Persistence design

### Current MVP

```ts
localStorage key: decklog-maintenance-jobs
value: JSON.stringify(MaintenanceJob[])
```

On first load, the app reads the key. If it is missing, seeded jobs are used. Whenever `jobs` changes, the current array is written back to local storage.

### Production migration

Replace the persistence effect with a typed repository interface:

```ts
interface MaintenanceRepository {
  listWorkOrders(vesselId: string): Promise<MaintenanceJob[]>;
  createWorkOrder(input: CreateWorkOrderInput): Promise<MaintenanceJob>;
  updateWorkOrder(id: string, patch: WorkOrderPatch): Promise<MaintenanceJob>;
  listEquipment(vesselId: string): Promise<Equipment[]>;
}
```

An API-backed implementation can then coexist with an offline repository without changing most UI components.

## 10. Proposed production database model

| Table | Important fields |
|---|---|
| `vessels` | `id`, `name`, `imo_number`, `status`, `timezone` |
| `users` | `id`, `name`, `email`, `role`, `active` |
| `vessel_crew` | `vessel_id`, `user_id`, `rank`, `department`, `onboard_from`, `onboard_to` |
| `equipment` | `id`, `vessel_id`, `tag`, `name`, `manufacturer`, `model`, `department`, `status` |
| `maintenance_plans` | `id`, `equipment_id`, `title`, `interval_value`, `interval_unit`, `priority` |
| `work_orders` | `id`, `vessel_id`, `plan_id`, `equipment_id`, `assigned_to`, `due_at`, `status`, `completion` |
| `work_order_events` | `id`, `work_order_id`, `actor_id`, `event_type`, `metadata`, `created_at` |
| `attachments` | `id`, `work_order_id`, `storage_key`, `file_name`, `uploaded_by` |
| `spare_parts` | `id`, `vessel_id`, `part_number`, `description`, `quantity`, `reorder_level` |

## 11. API design proposal

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/vessels/:vesselId/work-orders` | List/filter work orders. |
| `POST` | `/api/v1/vessels/:vesselId/work-orders` | Create a work order. |
| `PATCH` | `/api/v1/work-orders/:id` | Update status, assignment, or schedule. |
| `GET` | `/api/v1/vessels/:vesselId/equipment` | List vessel assets. |
| `POST` | `/api/v1/vessels/:vesselId/equipment` | Register an asset. |
| `GET` | `/api/v1/vessels/:vesselId/reports/maintenance` | Return report metrics. |
| `GET` | `/api/v1/vessels/:vesselId/export/work-orders` | Generate an authorized export. |

All production endpoints should enforce vessel access, role permissions, input validation, audit events, and UTC timestamps.

## 12. Security design for production

- Use authenticated sessions with short-lived access tokens.
- Apply role-based permissions by vessel and department.
- Validate all status transitions on the server.
- Record actor, timestamp, previous value, and new value for changes.
- Restrict exports to authorized users.
- Store attachments in private object storage with signed URLs.
- Encrypt data in transit and at rest.
- Avoid placing credentials or API keys in the client bundle.

## 13. Offline-first design proposal

1. Store vessel data in IndexedDB rather than only localStorage.
2. Add a local mutation queue for creates and updates.
3. Assign client IDs to unsynced records.
4. Sync when connectivity returns.
5. Resolve conflicts using server version numbers and an explicit review queue.
6. Show sync state and last successful server sync to the officer.

## 14. Build and deployment

### Local development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

The build runs `tsc --noEmit` followed by `vite build` and writes static assets to `dist/`.

### Vercel configuration

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Root directory | Repository root, or `ship-maintenance-system` in a monorepo |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | `dist` |

## 15. Testing strategy

### Current checks

- TypeScript compilation during `npm run build`.
- Vite production bundle generation.
- Dev server HTTP response check.
- Manual workflow checks for navigation, create, status update, equipment registration, and export.

### Recommended automated tests

- Unit tests for status transitions and report calculations.
- Component tests for modals, filters, and empty states.
- Browser tests for create → start → complete workflow.
- Browser tests for CSV export.
- Responsive smoke tests at desktop and mobile widths.
- Accessibility scan for keyboard focus and labels.

## 16. Technical decisions

| Decision | Reason |
|---|---|
| React + TypeScript | Strong ecosystem and typed UI state. |
| Vite | Fast development and simple static deployment. |
| CSS instead of a component library | Keeps the visual system lightweight and custom. |
| Local storage for MVP | Enables a zero-backend portfolio demo. |
| CSV export in browser | Makes reporting demonstrable without a server. |
| Single-file MVP component module | Fast initial delivery; split before production scaling. |

## 17. Known limitations

- No authentication or authorization.
- Work-order IDs are browser-generated and not globally unique.
- Equipment state is currently session-only while work orders persist.
- Seeded dates and vessel position are demonstration data.
- No server validation, audit trail, attachment storage, or multi-user synchronization.
