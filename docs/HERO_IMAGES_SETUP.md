# Hero images setup – steps and where to find everything

Follow these steps so the hero (and other) images show on the site. The app looks up images **by name** in the database; Cloudinary holds the files.

---

## Step 1: Set Cloudinary and database env vars

**Where:** In your project root, file **`.env`** (same folder as `package.json`).

**What to set:**

| Variable | Where to get it |
|----------|-----------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard → **Settings** (gear) → **Product environment credentials** → **Cloud name** |
| `CLOUDINARY_API_KEY` | Same page → **API Key** |
| `CLOUDINARY_API_SECRET` | Same page → **API Secret** (click “Reveal”) |
| `DATABASE_URL` | Supabase → **Project Settings** → **Database** → **Connection string** (use **Session pooler**, not Direct) |

**Template:** See **`.env.example`** in the project root for the exact variable names (lines 7, 33–34).

---

## Step 2: Run the main image upload script

This creates/updates rows in the database and uploads from your `attached_assets` folder to Cloudinary (hero, services, events, etc.).

**Where to run:** Terminal, from the **JuliesFamily** folder (project root).

**Command:**

```bash
cd /Users/mac15/Kinflo-website/JuliesFamily
npx tsx scripts/upload-images-to-cloudinary.ts
```

**Script location:** `JuliesFamily/scripts/upload-images-to-cloudinary.ts`  
**Images it uses:** `JuliesFamily/attached_assets/` (files listed inside the script, e.g. `Volunteer-and-student-3-scaled-....jpg`, `PreK-Class-Photo-2025-....webp`, etc.)

If a file is missing you’ll see “Skipping … file not found”; the rest still run.

---

## Step 3: (Optional) Run the generated-images upload script

Use this if you want the **generated** hero/service/event images (e.g. AI-style PNGs) in the DB and on the site.

**Where to run:** Same as Step 2 – terminal from **JuliesFamily**.

**Command:**

```bash
npx tsx scripts/upload-generated-images.ts
```

**Script location:** `JuliesFamily/scripts/upload-generated-images.ts`  
**Images it uses:** `JuliesFamily/attached_assets/generated_images/` (e.g. `Adult_education_students_learning_781bb5d3.png`, `Volunteer_tutoring_adult_student_4485b0ce.png`, etc.)

---

## Step 4: Reload the site

**Where:** Your browser, at `http://localhost:5000` (with `npm run dev` running).

Refresh the home page; the hero section should show the image for the default (or current persona) hero.

---

## If you prefer to add images manually (no script)

You can register hero images one-by-one in the app instead of running the scripts.

**Where:** In the app: **Admin Dashboard** → **Images** (link in the admin nav).

**For each hero image:**

1. Click **Add image** (or equivalent).
2. Set **Name** to the exact hero name, e.g. `hero-volunteer-student`, `hero-donor`, `hero-student`, `hero-parent`, `hero-volunteer`.
3. Set the **URL** to the image’s Cloudinary URL.

**Where to get the URL:** Cloudinary **Media Library** → open **julies-family-learning** → **hero** (or **generated**) → click the image → copy the **URL** (or “Secure URL”) from the details panel.

**Hero names the app expects:** See `JuliesFamily/shared/defaults/heroDefaults.ts` (e.g. `hero-volunteer-student`, `hero-donor`, `hero-student`, `hero-parent`, `hero-volunteer`, `hero-provider`, `hero-student-success`).

---

## Quick reference – file and UI locations

| What | Where |
|------|--------|
| Env vars | `JuliesFamily/.env` |
| Env template | `JuliesFamily/.env.example` |
| Main upload script | `JuliesFamily/scripts/upload-images-to-cloudinary.ts` |
| Generated-images script | `JuliesFamily/scripts/upload-generated-images.ts` |
| Local hero/service/event files | `JuliesFamily/attached_assets/` |
| Local generated images | `JuliesFamily/attached_assets/generated_images/` |
| Cloudinary credentials | Cloudinary Dashboard → Settings → Product environment credentials |
| Supabase connection string | Supabase → Project Settings → Database → Connection string (Session pooler) |
| Admin Images UI | App → log in as admin → **Admin Dashboard** → **Images** |
| Hero image names used by app | `JuliesFamily/shared/defaults/heroDefaults.ts` |
