# Business Requirements Document (BRD)

## 1. Document control

| Field | Value |
|---|---|
| Project | DeckLog PMS — Planned Maintenance System |
| Domain | Merchant Navy / Vessel Operations |
| Version | 1.0 |
| Status | MVP / Portfolio Release |
| Owner | DeckLog PMS Product Team |
| Last updated | 08 October 2026 |

## 2. Executive summary

DeckLog PMS is a browser-based planned maintenance system for merchant navy vessels. It gives onboard officers a single operational view of equipment health, maintenance work orders, due dates, overdue tasks, crew assignments, and maintenance performance.

The current release is a functional front-end MVP for the vessel **MV Ardent Horizon**. It demonstrates the core maintenance workflow using realistic vessel data, local browser persistence, responsive navigation, and CSV reporting. A future production release can connect the interface to a secure backend, authentication, audit history, document storage, inventory, and offline synchronization.

## 3. Business problem

Vessel maintenance information is often distributed across paper logs, spreadsheets, messaging applications, and separate machinery records. This creates operational problems:

- Critical maintenance tasks can become overdue.
- Officers have limited visibility of overall vessel readiness.
- Work may not be clearly assigned to a responsible crew member.
- Equipment service history is difficult to review during handover.
- Management reports take time to compile manually.
- Maintenance decisions are difficult when the vessel has intermittent connectivity.

## 4. Business objectives

1. Provide a clear daily maintenance overview for the onboard officer.
2. Reduce the risk of missed or overdue planned maintenance.
3. Make ownership of each maintenance task visible.
4. Improve visibility of equipment health and vessel readiness.
5. Support faster handover between deck, engine, and safety personnel.
6. Produce a simple exportable work-order report.
7. Create a credible foundation for a production-grade maritime maintenance platform.

## 5. Stakeholders

| Stakeholder | Interest / responsibility |
|---|---|
| Chief Officer | Oversees deck maintenance, safety equipment, and vessel readiness. |
| Chief Engineer | Oversees engine-room machinery and engineering maintenance. |
| Second Engineer | Executes and updates engine work orders. |
| Second Officer | Maintains navigation and deck-related tasks. |
| Bosun | Executes deck equipment and safety maintenance. |
| Master / Captain | Needs a high-level readiness and overdue-task view. |
| Technical Superintendent | Reviews fleet performance and maintenance compliance. |
| Ship management | Needs reliable reporting, auditability, and operational trends. |

## 6. Scope

### 6.1 In scope for the current MVP

- Vessel dashboard for MV Ardent Horizon.
- Work-order list with status, priority, due date, equipment, and assignee.
- Search and status filtering.
- Work-order details with service instructions and completion progress.
- Start, complete, and reopen work-order actions.
- New work-order creation.
- Equipment asset register with health scores and service dates.
- New equipment registration.
- Crew workload view.
- Maintenance performance report and trend visualization.
- CSV export of work orders.
- Local browser persistence through `localStorage`.
- Responsive desktop and mobile layout.

### 6.2 Out of scope for the current MVP

- Real user accounts and authentication.
- Multi-vessel or fleet-level backend storage.
- Server-side synchronization.
- Real-time vessel telemetry.
- Spare-parts purchasing and inventory transactions.
- Attachment upload and document approval.
- Email, SMS, or push notifications.
- Regulatory submission or class-society integration.
- Offline conflict resolution across multiple devices.

## 7. Business requirements

| ID | Requirement | Priority | Success measure |
|---|---|---:|---|
| BR-01 | Officers shall see the current maintenance status immediately after opening the application. | Must | Dashboard loads with vessel status and maintenance metrics. |
| BR-02 | The system shall identify overdue tasks clearly. | Must | Overdue count, color state, and due message are visible. |
| BR-03 | Each open task shall show its responsible crew member. | Must | Assignee appears in queue and work-order table. |
| BR-04 | Officers shall be able to create a new planned maintenance task. | Must | New task appears in the queue after form submission. |
| BR-05 | Officers shall be able to start, complete, and reopen a task. | Must | Status and completion percentage update immediately. |
| BR-06 | Users shall be able to search and filter work orders. | Must | Results update without a page reload. |
| BR-07 | Users shall be able to review critical equipment readiness. | Must | Equipment health and next service information are available. |
| BR-08 | Users shall be able to review crew maintenance workload. | Should | Crew page shows open-task counts. |
| BR-09 | Users shall be able to export work-order data. | Should | Browser downloads a CSV report. |
| BR-10 | The application shall preserve browser-session changes. | Should | Reloading the same browser retains work-order changes. |
| BR-11 | The interface shall work on a mobile screen. | Must | Navigation and core content remain usable at narrow widths. |
| BR-12 | The system shall support a future secure multi-user backend. | Future | Architecture can replace local persistence with an API/database. |

## 8. Assumptions and constraints

- The MVP uses representative vessel data and is not connected to a live vessel.
- Dates are displayed in a user-friendly format while stored as ISO date strings.
- A production version will require a defined vessel timezone and UTC policy.
- The current persistence model is browser-local and should not be treated as an official maintenance record.
- Work completion and equipment health are demo workflows until backend validation and authorization are added.

## 9. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Local data is lost when browser storage is cleared. | High | Add backend persistence and export/import before production use. |
| Unauthorized users change maintenance records. | High | Add authentication, role-based permissions, and audit logs. |
| Poor connectivity interrupts shipboard operations. | High | Add offline-first storage, sync queues, and conflict handling. |
| Incorrect due dates create false compliance signals. | High | Add UTC/timezone rules, validation, and server-side date handling. |
| Equipment records are incomplete. | Medium | Add mandatory asset metadata and import validation. |

## 10. Business acceptance criteria

The MVP is accepted when:

1. A user can see open, overdue, due-soon, and readiness information on the dashboard.
2. A user can create a work order and see it in the work-order list.
3. A user can open a work order, start it, complete it, and reopen it.
4. A user can search and filter the work-order list.
5. A user can add equipment and see it in the equipment register.
6. A user can navigate to crew and reports views.
7. A user can download a CSV export.
8. A user can reload the browser and retain local work-order changes.
9. The production build completes successfully.

## 11. Future roadmap

### Phase 2 — Operational foundation

- Login and role-based access.
- Supabase/PostgreSQL database.
- Work-order audit history.
- Equipment service history.
- Spare-parts inventory.

### Phase 3 — Shipboard readiness

- Offline-first mobile experience.
- Sync queue and conflict resolution.
- Attachments and inspection sign-off.
- Notifications for overdue and critical tasks.

### Phase 4 — Fleet intelligence

- Multi-vessel management.
- Superintendent portal.
- Fleet KPI comparison.
- Planned-vs-corrective maintenance analytics.
- Integration with vessel management and telemetry systems.
