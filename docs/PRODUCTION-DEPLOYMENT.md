# Production Deployment Guide

This guide converts the current DeckLog PMS portfolio MVP into a deployable multi-user application.

## 1. Recommended production architecture

Use the following stack for the first real deployment:

```text
Browser / mobile browser
          │
          ▼
Vercel (React + Vite static frontend)
          │ HTTPS / Supabase client
          ▼
Supabase
  ├── Auth: email/password or magic link
  ├── PostgreSQL: vessels, equipment, users, work orders
  ├── Row Level Security: vessel-level permissions
  ├── Storage: certificates, maintenance photos, reports
  └── Edge Functions: secret API integrations and notifications
```

### Why this stack

- It removes the need to build and host a separate Express server for the MVP.
- PostgreSQL is a good fit for relational vessel, equipment, crew, and work-order data.
- Supabase Auth provides user accounts.
- Row Level Security prevents one vessel's data from being exposed to another vessel.
- Vercel is simple for deploying a Vite frontend and supports automatic Git deployments.

## 2. What works today and what must change

### Current project

The UI is already deployable as a static demo. Work orders are stored in the browser using `localStorage`; therefore:

- A new browser starts with its own data.
- Users cannot share updates.
- There is no login or permission control.
- Data is not an official maintenance record.

### Required production work

1. Create a Supabase project.
2. Run the schema in `supabase/migrations/001_initial_schema.sql`.
3. Add Supabase Auth.
4. Replace the `localStorage` repository with Supabase queries.
5. Add a current-user and current-vessel context.
6. Add loading, error, and permission states.
7. Add Storage for attachments.
8. Deploy the frontend to Vercel with environment variables.
9. Test with at least two users and two vessels before real use.

## 3. Create the Supabase backend

### Step 1 — Create the project

1. Open [supabase.com](https://supabase.com) and sign in with GitHub.
2. Select **New project**.
3. Choose an organization and a region close to your users or vessel-management office.
4. Save the database password in a password manager.
5. Wait for the project to finish provisioning.

### Step 2 — Create the database schema

1. Open the project dashboard.
2. Select **SQL Editor → New query**.
3. Paste the complete contents of `supabase/migrations/001_initial_schema.sql`.
4. Run the query.
5. Open **Table Editor** and confirm these tables exist:
   - `profiles`
   - `vessels`
   - `vessel_members`
   - `equipment`
   - `maintenance_plans`
   - `work_orders`
   - `work_order_events`
6. Confirm RLS is enabled on the tables.

### Step 3 — Enable authentication

1. Open **Authentication → Providers**.
2. Enable Email provider.
3. For a portfolio demo, email confirmation may be disabled temporarily.
4. For production, keep email confirmation enabled and configure SMTP.
5. Create your first account under **Authentication → Users → Add user** or through the app's future login page.

### Step 4 — Create the first vessel and membership

After the first user exists, run the optional seed block at the bottom of the SQL migration. Replace `you@example.com` with the account email.

For production, create an admin-only setup screen or use a protected server-side script. Do not let any anonymous browser create memberships.

## 4. Connect the frontend to Supabase

Install the client library:

```bash
cd /home/atifmakandar/ship-maintenance-system
npm install @supabase/supabase-js
```

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

From Supabase **Project Settings → API**, copy:

```text
Project URL       → VITE_SUPABASE_URL
Publishable key   → VITE_SUPABASE_ANON_KEY
```

The current Supabase dashboard may call the publishable key `anon public`. It is safe to expose this browser key only when RLS policies are correct.

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, anonKey);
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable. Never commit `.env.local`.

## 5. Replace local storage with database calls

Create a repository layer instead of calling Supabase directly from every UI component:

```ts
import { supabase } from './supabase';

export async function listWorkOrders(vesselId: string) {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*, equipment(name, tag), profiles:assigned_to(full_name)')
    .eq('vessel_id', vesselId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createWorkOrder(input: {
  vesselId: string;
  equipmentId: string;
  title: string;
  department: 'Deck' | 'Engine' | 'Safety' | 'Electrical' | 'Management';
  dueDate: string;
  priority: 'Critical' | 'High' | 'Routine';
  assignedTo?: string;
  intervalLabel: string;
  notes: string;
  userId: string;
}) {
  const { data, error } = await supabase
    .from('work_orders')
    .insert({
      vessel_id: input.vesselId,
      equipment_id: input.equipmentId,
      title: input.title,
      department: input.department,
      due_date: input.dueDate,
      priority: input.priority,
      assigned_to: input.assignedTo ?? null,
      interval_label: input.intervalLabel,
      notes: input.notes,
      created_by: input.userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkOrderStatus(
  id: string,
  status: 'Scheduled' | 'In progress' | 'Overdue' | 'Completed',
  completion: number,
) {
  const { data, error } = await supabase
    .from('work_orders')
    .update({ status, completion })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

Then update `App.tsx` in this order:

1. Load the authenticated user with `supabase.auth.getUser()`.
2. Load the user's active vessel membership.
3. Fetch work orders and equipment after `vesselId` is known.
4. Replace `setJobs` mutations with repository calls.
5. Keep optimistic UI only after the database call succeeds or add rollback on failure.
6. Add loading and error banners.
7. Subscribe to `supabase.auth.onAuthStateChange`.

Do not delete the local demo data until the Supabase path works. Keep a development fallback behind an explicit environment flag if useful.

## 6. Add authentication UI

Create these screens:

- `/login` — email/password or magic link.
- `/forgot-password` — password reset.
- `/select-vessel` — shown if a user belongs to multiple vessels.
- `/app` — protected maintenance workspace.

Basic login example:

```ts
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

Before rendering maintenance data, require:

1. A valid authenticated session.
2. An active `vessel_members` record.
3. A selected `vessel_id`.

## 7. Supabase Storage for maintenance evidence

Create a private bucket named `maintenance-attachments`.

Recommended object path:

```text
{vessel_id}/{work_order_id}/{uuid}-{original_file_name}
```

Store only the object path and metadata in the database. Use signed URLs for downloads. Add Storage policies so users can access files only if they are members of the related vessel.

Allowed files should be limited by type and size, for example:

- PDF certificates
- JPEG/PNG inspection photographs
- CSV or XLSX service reports
- Maximum 10 MB per file for the MVP

## 8. API and cloud services

### Required for first production release

| Service | Purpose | Required now? |
|---|---|---:|
| Supabase Auth | Login and sessions | Yes |
| Supabase Postgres | Application data | Yes |
| Supabase RLS | Vessel-level security | Yes |
| Supabase Storage | Attachments | Recommended |
| Vercel | Frontend hosting and CI/CD | Yes |
| GitHub | Source control and deployment trigger | Yes |

### Add later

| Service | Purpose |
|---|---|
| Supabase Edge Functions | Secret API calls, scheduled jobs, notifications |
| Resend / Postmark | Email alerts |
| Sentry | Frontend and backend error monitoring |
| Open-Meteo Marine API | Route/weather context, if a voyage module is added |
| Mapbox or MapLibre | Interactive vessel/port map, if a voyage module is added |
| Cron / Supabase scheduled function | Daily overdue-task checks |

Do not call paid APIs with secret keys directly from React. Use a Supabase Edge Function or server route for any provider requiring a secret.

## 9. Overdue-task automation

The current UI displays seeded overdue records. A production system should calculate overdue status from dates on the server.

Recommended process:

1. Keep `due_date` as the source of truth.
2. Run a daily scheduled function at 00:05 vessel time.
3. Update `Scheduled` tasks with `due_date < current_date` to `Overdue`.
4. Insert a `work_order_events` record.
5. Notify the responsible officer for Critical and High tasks.

Do not rely only on a browser being open to calculate overdue work.

## 10. Deploy to Vercel

### Step 1 — Push the project to GitHub

From the project folder:

```bash
git init
git add .
git commit -m "Build DeckLog planned maintenance system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ship-maintenance-system.git
git push -u origin main
```

### Step 2 — Import into Vercel

1. Open [vercel.com](https://vercel.com) and sign in with GitHub.
2. Select **Add New → Project**.
3. Import the `ship-maintenance-system` repository.
4. Set **Framework Preset** to `Vite`.
5. Set **Root Directory** to `.` if the repository itself is this project.
6. Set **Build Command** to `npm run build`.
7. Set **Output Directory** to `dist`.
8. Set **Install Command** to `npm install`.
9. Add these Environment Variables for Production, Preview, and Development:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

10. Deploy.

### Step 3 — Configure Supabase Auth URLs

After Vercel gives you a URL, open Supabase **Authentication → URL Configuration**:

- **Site URL:** your production Vercel URL
- **Redirect URLs:**
  - `https://your-project.vercel.app/**`
  - `http://localhost:5173/**`

When using a custom domain, add the custom domain as well.

### Step 4 — Preview deployments

Vercel creates preview URLs for pull requests. Add the preview URL pattern to Supabase redirect URLs if you need preview login. For a private project, keep Deployment Protection enabled.

## 11. Custom domain and HTTPS

1. Buy a domain from a registrar.
2. In Vercel, open **Settings → Domains**.
3. Add the domain.
4. Add the DNS records Vercel shows.
5. Wait for certificate issuance.
6. Add the final HTTPS domain to Supabase Auth redirect URLs.

## 12. Testing before real use

### Required test accounts

- Chief Officer on Vessel A.
- Engineer on Vessel A.
- User with no Vessel A membership.
- User on Vessel B.

### Required security tests

1. Vessel A user cannot query Vessel B work orders.
2. A non-admin cannot change vessel membership.
3. An unauthenticated request cannot read work orders.
4. An officer cannot delete a work order unless policy allows it.
5. Attachments cannot be downloaded by another vessel's user.
6. Service-role keys never appear in browser source or Vercel client variables.

### Required workflow tests

1. Login and logout.
2. Create a work order.
3. Start, complete, and reopen a work order.
4. Filter and search work orders.
5. Add equipment.
6. Upload and download an attachment.
7. Export a report.
8. Refresh and confirm database state remains.
9. Test on a mobile viewport.
10. Test after a temporary network interruption.

## 13. Recommended implementation order

### Milestone 1 — Backend connection

- Install `@supabase/supabase-js`.
- Add `.env.local`.
- Run the SQL migration.
- Add Supabase client and auth session handling.
- Load real vessel and work-order records.

### Milestone 2 — Secure workflows

- Replace local create/update actions.
- Add RLS tests.
- Add event/audit writes.
- Add loading, error, and retry states.

### Milestone 3 — Attachments and operations

- Add Storage bucket.
- Add maintenance photo/certificate upload.
- Add scheduled overdue calculation.
- Add email or in-app notifications.

### Milestone 4 — Production hardening

- Add automated tests and Sentry.
- Add database backups and migration workflow.
- Add custom domain.
- Run a security review.
- Pilot with non-critical sample data before real vessel records.

## 14. Deployment checklist

- [ ] `.env.local` is not committed.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not in the frontend.
- [ ] Supabase migration has run successfully.
- [ ] RLS is enabled on every application table.
- [ ] At least one vessel membership exists.
- [ ] Vercel environment variables are set for all environments.
- [ ] Supabase redirect URLs contain the Vercel URL.
- [ ] `npm run build` passes.
- [ ] Login, create, update, filter, and export workflows pass.
- [ ] Cross-vessel access test passes.
- [ ] Custom domain and HTTPS are configured if needed.
- [ ] Backup and rollback process is documented.

## 15. Important production note

This project is suitable for a portfolio deployment today. Before using it as an official shipboard maintenance record, add authentication, server-side validation, database backups, audit history, controlled permissions, offline synchronization, and a formal operational/security review.
