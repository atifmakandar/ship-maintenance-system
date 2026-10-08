# Functional Requirements Document (FRD)

## 1. Document control

| Field | Value |
|---|---|
| Project | DeckLog PMS — Planned Maintenance System |
| Version | 1.0 |
| Status | MVP / Portfolio Release |
| Related document | [BRD](./BRD.md) |

## 2. Product roles

The MVP presents a single operational workspace. The following roles are modeled for the product and should become permission groups in a production backend:

| Role | Typical permissions |
|---|---|
| Chief Officer | Review dashboard, manage deck and safety tasks, export reports. |
| Chief Engineer | Manage engine equipment and engineering tasks. |
| Officer / Engineer | View assigned work, start and complete tasks. |
| Superintendent | Review reports and vessel readiness across vessels. |
| Administrator | Manage vessels, users, equipment, and configuration. |

## 3. Navigation requirements

| ID | Requirement |
|---|---|
| FR-001 | The application shall provide Dashboard, Work orders, Equipment, Crew, and Reports navigation items. |
| FR-002 | The active navigation item shall be visually identifiable. |
| FR-003 | The Work orders navigation item shall show the count of open work orders. |
| FR-004 | On mobile screens, navigation shall open through a menu button and close after selection. |
| FR-005 | The top bar shall show the current section and provide global work-order search. |

## 4. Dashboard requirements

| ID | Requirement |
|---|---|
| FR-010 | The dashboard shall show open work orders, overdue tasks, due-this-week tasks, and fleet readiness. |
| FR-011 | The dashboard shall show a maintenance queue of non-completed upcoming tasks. |
| FR-012 | Each queue item shall show the task title, equipment tag, assignee, due message, and due date. |
| FR-013 | Selecting a queue item shall open its work-order details. |
| FR-014 | The dashboard shall show an equipment readiness summary. |
| FR-015 | The dashboard shall provide a link to all work orders. |
| FR-016 | The dashboard shall provide a link to the reports view. |
| FR-017 | The dashboard shall show a notification popover for important maintenance events. |

## 5. Work-order requirements

| ID | Requirement |
|---|---|
| FR-020 | The system shall display work-order ID, task title, equipment, department, due date, priority, assignee, and status. |
| FR-021 | The system shall support Scheduled, In progress, Overdue, and Completed statuses. |
| FR-022 | The system shall support Critical, High, and Routine priorities. |
| FR-023 | The user shall be able to filter work orders by status. |
| FR-024 | The user shall be able to search by ID, title, equipment, equipment tag, or assignee. |
| FR-025 | Selecting a work-order row shall open a detail view. |
| FR-026 | The detail view shall show completion percentage, service interval, last serviced date, and maintenance instructions. |
| FR-027 | The user shall be able to start a scheduled or overdue task. |
| FR-028 | The user shall be able to mark an active task complete. |
| FR-029 | The user shall be able to reopen a completed task. |
| FR-030 | Completing a task shall set completion to 100%. |
| FR-031 | Starting a task shall set status to In progress and establish at least 45% completion in the MVP. |
| FR-032 | The system shall show a confirmation toast after status changes. |
| FR-033 | The system shall show an empty state when no work orders match a filter or search. |

## 6. New work-order requirements

| ID | Requirement |
|---|---|
| FR-040 | The user shall open the Create work order modal from the primary action. |
| FR-041 | Task title and due date shall be required. |
| FR-042 | The form shall capture equipment, department, priority, assignee, service interval, and notes. |
| FR-043 | On valid submission, the system shall generate a work-order ID. |
| FR-044 | The new order shall default to Scheduled with 0% completion. |
| FR-045 | The new order shall appear in the work-order list and dashboard queue where applicable. |
| FR-046 | Cancelling or closing the modal shall not create a work order. |

## 7. Equipment requirements

| ID | Requirement |
|---|---|
| FR-050 | The Equipment page shall show asset name, model/tag, health score, runtime, next service date, and status. |
| FR-051 | Equipment status shall support Operational, Watch, and Maintenance. |
| FR-052 | Health shall be displayed as a percentage and progress bar. |
| FR-053 | The user shall be able to open an Add equipment modal. |
| FR-054 | The equipment form shall capture name, tag, department, health score, runtime, next service date, and status. |
| FR-055 | A newly added asset shall appear in the asset register. |
| FR-056 | A newly added asset shall be available for future work-order assignment during the current browser session. |

## 8. Crew requirements

| ID | Requirement |
|---|---|
| FR-060 | The Crew page shall show onboard crew members, role, department, and duty status. |
| FR-061 | The Crew page shall show each member's count of open assigned tasks. |
| FR-062 | The Crew page shall provide a profile action placeholder for future crew details. |

## 9. Reports and export requirements

| ID | Requirement |
|---|---|
| FR-070 | The Reports page shall show vessel readiness and maintenance performance. |
| FR-071 | The Reports page shall show completion rate based on current work-order data. |
| FR-072 | The Reports page shall show open and overdue task counts. |
| FR-073 | The Reports page shall show a maintenance completion trend visualization. |
| FR-074 | Export report shall download work-order data as a CSV file. |
| FR-075 | The CSV shall contain ID, task, equipment, department, due date, priority, assignee, and status. |
| FR-076 | The Reports page shall provide an action to restore the seeded demo data. |

## 10. Persistence requirements

| ID | Requirement |
|---|---|
| FR-080 | Work-order changes shall be saved to the browser's local storage. |
| FR-081 | The application shall load saved work orders on startup when valid data exists. |
| FR-082 | The application shall use seed data when no saved work orders exist. |
| FR-083 | Reset demo data shall replace saved work orders with the seeded dataset. |
| FR-084 | Equipment additions shall remain available for the current browser session. |

## 11. Validation and error handling

| ID | Requirement |
|---|---|
| FR-090 | Required form inputs shall block submission when empty. |
| FR-091 | Health score shall accept values from 0 to 100. |
| FR-092 | The app shall avoid navigation reloads for normal interactions. |
| FR-093 | Empty search/filter results shall provide a clear recovery hint. |
| FR-094 | Status and create actions shall provide visible feedback. |

## 12. Functional acceptance scenarios

### Scenario A — Create and complete a task

1. User selects **New work order**.
2. User enters a task title and required due date.
3. User selects equipment, department, priority, and assignee.
4. User selects **Create work order**.
5. System adds the new Scheduled order.
6. User opens the order and selects **Start job**.
7. System changes status to In progress.
8. User selects **Mark complete**.
9. System changes status to Completed and completion to 100%.

### Scenario B — Find overdue work

1. User opens Work orders.
2. User selects the Overdue filter.
3. System displays only overdue orders.
4. User searches by equipment or assignee.
5. System narrows results without a reload.

### Scenario C — Register equipment

1. User opens Equipment.
2. User selects **Add equipment**.
3. User fills asset metadata and submits.
4. System adds the asset card to the register.

### Scenario D — Export report

1. User selects **Export report**.
2. System generates a CSV from current work-order state.
3. Browser downloads the file with a date-based filename.
