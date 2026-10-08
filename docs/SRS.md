# Software Requirements Specification (SRS)

## 1. Document control

| Field | Value |
|---|---|
| Project | DeckLog PMS — Planned Maintenance System |
| Version | 1.0 |
| Status | MVP / Portfolio Release |
| Related documents | [BRD](./BRD.md), [FRD](./FRD.md), [TDI](./TDI.md) |

## 2. Purpose

This SRS defines the software requirements for DeckLog PMS, a responsive single-page application that demonstrates planned maintenance workflows for a merchant navy vessel. It is the technical contract between the product behavior described in the FRD and the implementation described in the TDI.

## 3. Product overview

DeckLog PMS runs as a client-side React application. It presents seed data for MV Ardent Horizon and allows users to manage work orders and equipment within the browser. The current MVP does not include a remote API or login system.

## 4. System boundary

### 4.1 Current system

```text
User browser
   │
   ├── React UI and navigation
   ├── Client-side state management
   ├── Work-order and equipment workflows
   ├── CSV export through browser download
   └── localStorage persistence for work orders
```

### 4.2 Future production boundary

```text
Browser / PWA
   │ HTTPS
API / authentication service
   │
PostgreSQL database ── object storage ── notification service
```

## 5. User stories

| ID | User story | Priority |
|---|---|---:|
| US-01 | As a Chief Officer, I want to see overdue maintenance immediately so I can prioritize corrective action. | Must |
| US-02 | As an Engineer, I want to see my assigned tasks so I know what to complete during my watch. | Must |
| US-03 | As an Officer, I want to start and complete a job so maintenance status reflects onboard progress. | Must |
| US-04 | As an Officer, I want to create a work order so newly identified work enters the maintenance queue. | Must |
| US-05 | As an Officer, I want to search by equipment or assignee so I can locate a job quickly. | Must |
| US-06 | As a Chief Engineer, I want to view equipment health so I can identify assets that need attention. | Must |
| US-07 | As a Superintendent, I want to download work-order data so I can review it outside the application. | Should |
| US-08 | As a user on a small screen, I want navigation and cards to remain usable on mobile. | Must |

## 6. Functional software requirements

### 6.1 Dashboard

- **SRS-F-001:** On initial load, the app shall render the Dashboard section.
- **SRS-F-002:** The dashboard shall calculate open, overdue, due-soon, and completed counts from the current job state.
- **SRS-F-003:** The dashboard shall render a non-completed maintenance queue.
- **SRS-F-004:** The dashboard shall provide navigation to Work orders, Equipment, and Reports.

### 6.2 Work orders

- **SRS-F-010:** A work order shall contain all fields in the data dictionary in Section 8.
- **SRS-F-011:** Work-order status transitions shall support Scheduled → In progress → Completed and Completed → Scheduled.
- **SRS-F-012:** A user shall be able to open a detail modal for a work order.
- **SRS-F-013:** Search shall match ID, title, equipment, equipment tag, and assignee case-insensitively.
- **SRS-F-014:** Filters shall match exact status values.
- **SRS-F-015:** Completion actions shall update the current in-memory state and persisted state.

### 6.3 Equipment

- **SRS-F-020:** An equipment record shall include a unique ID and health score between 0 and 100.
- **SRS-F-021:** A user shall be able to register an equipment record through the Add equipment modal.
- **SRS-F-022:** The Equipment page shall render asset status, service date, runtime, and health progress.
- **SRS-F-023:** New equipment options shall be available to the work-order form during the same session.

### 6.4 Reports and export

- **SRS-F-030:** The completion rate shall be calculated as completed jobs divided by total jobs, rounded to a whole percentage.
- **SRS-F-031:** CSV export shall quote values safely and escape embedded quotation marks.
- **SRS-F-032:** Export shall use a browser Blob and a date-based filename.
- **SRS-F-033:** Reset demo data shall restore the seeded work-order dataset.

## 7. Non-functional requirements

| ID | Category | Requirement | Target / verification |
|---|---|---|---|
| SRS-NF-001 | Performance | Initial client bundle should remain suitable for a dashboard MVP. | Vite production build completes and emits compressed asset sizes. |
| SRS-NF-002 | Responsiveness | Layout shall support desktop, tablet, and mobile widths. | CSS breakpoints at 1120px, 840px, and 600px. |
| SRS-NF-003 | Accessibility | Interactive controls shall have readable labels or accessible names. | Buttons use visible text or `aria-label`; keyboard focus styles exist for rows and queue items. |
| SRS-NF-004 | Usability | Primary actions shall be easy to identify. | Teal primary buttons for new, complete, and add actions. |
| SRS-NF-005 | Reliability | Normal UI actions shall not require a page reload. | React state updates local UI immediately. |
| SRS-NF-006 | Data integrity | User-created work orders shall survive a browser reload. | `localStorage` write occurs whenever job state changes. |
| SRS-NF-007 | Compatibility | The app shall run in modern Chromium, Firefox, and Safari browsers. | Uses standard React, DOM, CSS, Blob, and localStorage APIs. |
| SRS-NF-008 | Security | The MVP shall not claim production-grade authorization. | Backend authentication is explicitly future scope. |
| SRS-NF-009 | Maintainability | Core behavior shall use typed TypeScript models. | `MaintenanceJob`, `Equipment`, and union types are defined in `App.tsx`. |
| SRS-NF-010 | Deployment | The app shall deploy as a static Vite site. | Build output is `dist`. |

## 8. Data dictionary

### 8.1 MaintenanceJob

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | string | Yes | Work-order identifier such as `WO-2481`. |
| `title` | string | Yes | Maintenance task title. |
| `equipment` | string | Yes | Associated equipment name. |
| `equipmentTag` | string | Yes | Asset tag such as `ME-001`. |
| `department` | string | Yes | Engine, Deck, Safety, or other department. |
| `dueDate` | ISO date string | Yes | Planned due date. |
| `interval` | string | Yes | Service interval or trigger. |
| `status` | enum | Yes | Scheduled, In progress, Overdue, Completed. |
| `priority` | enum | Yes | Critical, High, Routine. |
| `assignedTo` | string | Yes | Crew member responsible for the task. |
| `completion` | number | Yes | Completion percentage from 0 to 100. |
| `lastServiced` | string | Yes | Last service date or placeholder. |
| `notes` | string | Yes | Maintenance instruction or note. |

### 8.2 Equipment

| Field | Type | Required | Description |
|---|---|---:|---|
| `id` | string | Yes | Asset identifier. |
| `name` | string | Yes | Equipment display name. |
| `tag` | string | Yes | Model or asset tag. |
| `department` | string | Yes | Responsible department. |
| `health` | number | Yes | Health percentage, 0–100. |
| `runtime` | string | No | Running hours or dash placeholder. |
| `nextService` | string | Yes | Next service date. |
| `status` | enum | Yes | Operational, Watch, Maintenance. |
| `accent` | string | Yes | Presentation color for the asset card. |

## 9. State and validation rules

1. Work-order IDs are generated in the browser for the MVP.
2. Empty task titles are rejected by browser form validation.
3. Due dates are required for new work orders.
4. Equipment health is constrained to 0–100 by the input control.
5. Completed jobs have 100% completion.
6. Starting a task retains any prior completion value but raises it to at least 45%.
7. Reset demo data replaces all saved work orders; it does not persist newly added records.

## 10. External interfaces

### Current MVP

- Google Fonts are loaded through CSS from `fonts.googleapis.com`.
- The browser download API creates CSV exports.
- `localStorage` stores current work-order data.

### Future interfaces

- Authentication provider.
- REST or typed RPC API.
- PostgreSQL/Supabase database.
- Object storage for certificates and maintenance evidence.
- Notification service for task reminders.

## 11. Traceability matrix

| Business requirement | Functional requirements | Implementation area |
|---|---|---|
| BR-01, BR-02 | FR-010–FR-014 | Dashboard components |
| BR-03, BR-04, BR-05 | FR-020–FR-046 | Work-order state and modals |
| BR-06 | FR-023–FR-024 | Search and filter state |
| BR-07 | FR-050–FR-056 | Equipment view and asset modal |
| BR-08 | FR-060–FR-062 | Crew view |
| BR-09 | FR-070–FR-076 | Reports and CSV export |
| BR-10 | FR-080–FR-084 | `localStorage` effect |
| BR-11 | FR-001–FR-005 | Responsive navigation and CSS |

## 12. Definition of done

- Requirements are implemented or explicitly marked future scope.
- TypeScript compilation passes.
- Vite production build passes.
- Dashboard and main navigation render without runtime errors.
- Work-order create/update flows are manually verified.
- Documentation is committed with the source project.
