# React + TypeScript migration audit

Audit date: 2026-11-20
Repository: `tulsiram01/pramod-printers-general-shop`
Migration branch: `feature/react-typescript-migration`
Backup branch: `backup/pre-react-migration-20261120`

## Existing application findings

- Current production frontend is a static HTML/CSS/JavaScript site in the repository root (`index.html`).
- The current admin interface is `admin.html`, `admin.css`, and `admin.js`.
- Supabase browser configuration is in `supabase-config.js`. It contains the project URL and a publishable/anon browser key; no service-role key is used in the React client.
- The existing SQL schema defines `public.designs` with `id`, `title`, `category`, `image_url`, `description`, `is_published`, and `created_at`.
- Admin membership is stored in `public.admin_users` and checked through the existing `public.is_admin()` RLS helper and table policies.
- Admin login uses Supabase Auth password sign-in. The existing admin UI checks membership and manages designs with select/insert/update/delete operations.
- Existing public gallery reads published designs; design images are stored as URLs in `image_url` (the current admin form accepts an image URL, including Google Drive links). No Storage bucket schema or upload contract was found in the inspected admin workflow.
- The existing static home page also contains service information, contact details, AEPS disclaimers, legal/developer pages, and a separate static invitation gallery. The React first pass recreates the service/contact/AEPS sections and connects its gallery to the existing Supabase `designs` table.

## Data safety and migration boundary

- No Supabase table, row, Storage bucket, Auth user, policy, or SQL migration is modified by this React scaffold.
- React reads the existing `designs` table and uses the same Supabase Auth project.
- Admin writes are performed against the same `designs` table and remain subject to the existing RLS policies.
- No service-role key is embedded in browser code.
- The old root website remains the production website. React source is isolated under `react-preview/` on this feature branch.
- The Git backup branch is a source-code snapshot only. It is not a database export. A separate Supabase database/Storage backup should be taken in Supabase before any production cutover.

## Known items to verify before cutover

1. Confirm the Supabase project has the expected `designs` and `admin_users` tables and that the existing RLS policies are enabled.
2. Test an authorized admin and a non-admin account; non-admin access must be denied.
3. Confirm existing gallery rows and their external image URLs load in the React preview.
4. Confirm create, edit, publish/unpublish, and delete operations work as expected.
5. Confirm the current production static invitation cards are either represented in Supabase or explicitly carried over before replacing the old home page.
6. Verify existing Google Drive image URLs still resolve and check any hotlink/CORS restrictions.
7. Check GitHub Pages deployment settings. The production site must not be switched to the React version until the combined static+React deployment is verified.

## Current React scaffold

- React 18, Vite 5, TypeScript 5, React Router HashRouter (GitHub Pages compatible), Lucide icons.
- Public pages include the shop landing page, services, invitation gallery, online-form enquiry, AEPS disclaimer, about and contact sections.
- Admin route provides Supabase Auth login, admin membership verification, gallery CRUD, visibility state, and counts.
- Supabase configuration is supplied to Vite from the existing public project URL and publishable key; replace only if the Supabase project configuration changes.

## Important limitation

The React admin currently supports URL-based image records, matching the inspected legacy form. A direct file-upload workflow to Supabase Storage is not added because the existing inspected admin workflow did not establish a Storage bucket name, allowed MIME types, or upload policy. Do not create or assume a bucket until its current configuration is confirmed.
