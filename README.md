# Pramod Printers & General Shop

A responsive website for **Pramod Printers & General Shop** that brings printing services, digital assistance, invitation-card designs, and customer enquiries together in one place. The project also includes an admin dashboard for managing the invitation/design gallery.

> **Project type:** Static HTML/CSS/JavaScript website with Supabase Auth and Supabase Database integration.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Supabase Configuration](#supabase-configuration)
- [Database Setup](#database-setup)
- [Admin Dashboard](#admin-dashboard)
- [Adding Design Images](#adding-design-images)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

The website is designed to present the shop's services and make it easy for visitors to browse invitation designs or contact the business. The public site is served from `index.html`; the separate `admin.html` page provides an authenticated dashboard to create, edit, publish, hide, and delete gallery designs.

The site uses Supabase for admin authentication and for storing design metadata. Design image files are currently supplied as image URLs (for example, shareable Google Drive links); the repository does not contain a dedicated image-upload backend.

## Features

### Public website

- Responsive layout for desktop, tablet, and mobile screens.
- Hindi-first business presentation with service information.
- Hero section with promotional slider.
- Printing and digital-service information, including invitation-card services.
- Invitation/design gallery with category filters such as:
  - शादी कार्ड
  - भागवत
  - जन्मदिन
  - गृह प्रवेश
  - अन्य
- WhatsApp enquiry links and customer contact options.
- Privacy Policy and Terms & Conditions pages.
- LocalBusiness structured data and basic page metadata for search engines.

### Admin dashboard

- Supabase email/password authentication.
- Dashboard statistics for total, published, and hidden designs.
- Add and edit design records.
- Category selection and design descriptions.
- Image URL preview before saving.
- Publish or hide designs without deleting them.
- Search and manage existing designs.
- Logout and session handling.

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| UI | Responsive custom CSS |
| Icons | Font Awesome |
| Fonts | Google Fonts |
| Admin authentication | Supabase Auth |
| Design metadata | Supabase PostgreSQL |
| Database security | PostgreSQL Row Level Security (RLS) |
| Image source | External image URLs (e.g. Google Drive) |

## Project Structure

```text
pramod-printers-general-shop/
├── assets/
│   ├── logo.png
│   ├── logo2.png
│   └── ...                 # Website images and visual assets
├── index.html              # Public website
├── admin.html              # Admin login and dashboard
├── admin.css               # Admin dashboard styles
├── admin.js                # Admin logic and Supabase operations
├── supabase-config.js      # Supabase project configuration
├── database.sql            # PostgreSQL table and RLS policies
├── privacy.html            # Privacy policy
├── terms.html              # Terms and conditions
├── developer.html          # Developer / project information page
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites

- A modern web browser.
- A local static web server (recommended; do not rely on opening files directly with `file://`).
- A Supabase project for admin authentication and the designs database.

### 1. Clone the repository

```bash
git clone https://github.com/tulsiram01/pramod-printers-general-shop.git
cd pramod-printers-general-shop
```

### 2. Configure Supabase

Open `supabase-config.js` and configure your own Supabase project URL and publishable/anon key:

```javascript
window.SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_PUBLISHABLE_KEY"
};
```

Use the publishable (previously anon) key intended for browser applications. **Never place a Supabase service-role key or any other secret in frontend code.**

### 3. Run locally

You can use the VS Code **Live Server** extension, or run a local server with Python:

```bash
python -m http.server 5500
```

Open:

- Public website: http://localhost:5500/
- Admin dashboard: http://localhost:5500/admin.html

The exact command may vary depending on your local development environment.

## Supabase Configuration

The admin panel expects the Supabase JavaScript client v2, which is loaded by `admin.html` from a CDN. The app reads the project URL and browser-safe publishable key from `supabase-config.js`.

Before using the admin dashboard:

1. Create or select a Supabase project.
2. Set the project URL and publishable key in `supabase-config.js`.
3. Run the SQL in `database.sql` using the Supabase SQL Editor.
4. Enable the required email/password sign-in method in Supabase Authentication.
5. Create the intended admin user in Supabase Authentication.
6. Verify the RLS policies and test the public gallery and admin operations.

## Database Setup

The supplied `database.sql` creates the `public.designs` table and enables Row Level Security.

The table contains:

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID | Unique design identifier |
| `title` | TEXT | Design title |
| `category` | TEXT | Gallery category |
| `image_url` | TEXT | External image URL |
| `description` | TEXT | Optional design description |
| `is_published` | BOOLEAN | Controls public visibility |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

The current SQL policies allow public users to read published designs and authenticated users to perform the configured design-management operations.

**Important:** Authentication alone does not mean every authenticated account should be an administrator. Before production use, restrict insert, update, and delete access to a verified admin role (for example, using a trusted role claim or a dedicated admin-membership table and carefully designed RLS policies). Do not rely on hiding the admin page as an access-control mechanism.

## Admin Dashboard

Visit `/admin.html` and sign in with an account created in your Supabase project.

From the dashboard, an authorized administrator can:

1. View design totals and publication status.
2. Add a design with a title, category, image URL, and description.
3. Preview the image URL.
4. Publish or hide a design.
5. Edit or remove existing design records.
6. Search the design list.
7. Log out of the dashboard.

The public gallery should display only records marked as published, according to the database query and RLS configuration.

## Adding Design Images

The current admin form stores an image URL rather than uploading a file to a storage service.

For a Google Drive image:

1. Upload the image to Google Drive.
2. Open the file's sharing settings.
3. Set General access to **Anyone with the link – Viewer**, only for images intended to be public.
4. Copy the share link and paste it into the image URL field.
5. Confirm that the preview loads before saving.

For a production website, consider using Supabase Storage or another managed image host. Avoid making private customer documents or personal images publicly accessible.

## Deployment

This is a static frontend and can be deployed to any static hosting provider, for example:

- GitHub Pages
- Netlify
- Vercel
- Hostinger static website hosting

General deployment steps:

1. Push the project files to the repository.
2. Configure the hosting provider to serve the repository root.
3. Add the correct Supabase project URL and browser-safe publishable key.
4. Configure the production domain in Supabase Authentication URL settings and allowed redirect URLs, as applicable.
5. Test the public gallery and admin login on the deployed domain.
6. Confirm that RLS prevents unauthorized database operations.

No Node.js build command is required by the current plain HTML/CSS/JavaScript frontend.

## Security Notes

- Only use a browser-safe Supabase publishable/anon key in `supabase-config.js`.
- Never commit service-role keys, passwords, database connection strings, or private API tokens.
- Configure RLS policies so only designated administrators can create, edit, or delete designs.
- Use HTTPS on the production domain.
- Do not upload sensitive documents to publicly accessible image links.
- Review the contact details, privacy policy, terms, and structured business information before publishing.
- If a credential has ever been exposed, rotate it in the relevant provider dashboard.

## Customization

- **Business content and public sections:** `index.html`
- **Public website styles:** styles inside `index.html`
- **Admin layout:** `admin.html`
- **Admin styles:** `admin.css`
- **Admin and gallery behaviour:** `admin.js`
- **Supabase connection:** `supabase-config.js`
- **Database schema and policies:** `database.sql`
- **Brand images:** `assets/`
- **Legal pages:** `privacy.html` and `terms.html`

Update business contact details, location, working hours, and social links to match the shop's current official information.

## Troubleshooting

**Admin login does not work**
- Confirm the Supabase URL and publishable key.
- Confirm email/password authentication is enabled.
- Verify the admin account exists and can sign in.
- Check the browser console and Supabase Auth logs.

**Designs do not appear in the gallery**
- Confirm that the SQL schema has been applied.
- Confirm the record has `is_published = true`.
- Check the public SELECT RLS policy.
- Verify that the image URL is accessible and returns an image.

**Admin cannot save or edit designs**
- Check that the user is authenticated.
- Review the INSERT/UPDATE/DELETE RLS policies.
- Inspect browser console and Supabase logs for the actual database error.

**Google Drive image preview fails**
- Ensure the image is shared for public viewing.
- Try a direct image URL or move the image to a dedicated storage provider.
- Check whether the image host blocks cross-origin or direct image requests.

## License

No license file was present in the repository when this README was prepared. Unless a license is added, reuse and redistribution are not automatically granted. Add a `LICENSE` file if you intend to publish the project under an open-source license.

---

**Repository:** https://github.com/tulsiram01/pramod-printers-general-shop
