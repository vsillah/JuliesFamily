# Replit → New Environment Migration Checklist

Use this when moving Julie's Family (Kinflo) from Replit to your own hosting (e.g. Vercel, Railway, or local).

**Implementation status:** Auth (OIDC), BASE_URL, object storage (S3/R2), Twilio, Google, and Vite cleanup are implemented. Set the env vars below to run without Replit.

---

## 1. **Authentication** (implemented)

| Current | Change for new environment |
|--------|------------------------------|
| **Replit Auth** (OIDC via `replit.com/oidc`) | Use any OIDC provider (Auth0, Keycloak, Google, etc.). |
| **Files** | `server/replitAuth.ts` – now supports configurable OIDC. |
| **Env** | Set **`OIDC_ISSUER_URL`**, **`OIDC_CLIENT_ID`**, **`OIDC_CLIENT_SECRET`**. Optional: **`OIDC_CALLBACK_PATH`**. Callback URL is derived from **`BASE_URL`**. Legacy **`REPL_ID`** / **`ISSUER_URL`** still work. If OIDC vars are missing, `/api/login` returns 503 and the app still starts. |

Sessions use **PostgreSQL** and **`SESSION_SECRET`** – no change.

---

## 2. **Database**

| Current | Change for new environment |
|--------|------------------------------|
| **Postgres** via Drizzle + `@neondatabase/serverless` | Works with any Postgres (Neon, Railway, Supabase, local). |
| **Env** | Set `DATABASE_URL` (required at startup). |
| **Schema** | Run `npm run db:push` after setting `DATABASE_URL`. |

No code changes needed for the DB layer.

---

## 3. **Object storage** (implemented)

| Current | Change for new environment |
|--------|------------------------------|
| **Replit Object Storage** (GCS via sidecar) | Use S3 or R2 when not on Replit. |
| **Files** | `server/objectStorage.ts` (barrel), `server/objectStorageReplit.ts`, `server/objectStorageS3.ts`. |
| **Env** | Set **`OBJECT_STORAGE_PROVIDER=s3`**. Then set **`S3_BUCKET`** (or **`R2_BUCKET`**), **`PUBLIC_OBJECT_SEARCH_PATHS`** or **`S3_PUBLIC_PREFIXES`**, **`PRIVATE_OBJECT_DIR`** or **`S3_PRIVATE_PREFIX`**. For R2: **`R2_ACCOUNT_ID`**, **`R2_ACCESS_KEY_ID`**, **`R2_SECRET_ACCESS_KEY`**, **`R2_REGION=auto`**. Replit env (e.g. `DEFAULT_OBJECT_STORAGE_BUCKET_ID`) still used when provider is not `s3`. |

---

## 4. **Twilio (SMS)** (implemented)

| Current | Change for new environment |
|--------|------------------------------|
| **Replit Connectors** | Use direct Twilio credentials when not on Replit. |
| **Files** | `server/twilio.ts`, `server/services/twilioService.ts`, `server/routes.ts` (webhook). |
| **Env** | Set **`TWILIO_ACCOUNT_SID`**, **`TWILIO_AUTH_TOKEN`**, **`TWILIO_PHONE_NUMBER`**. Webhook validation uses **`TWILIO_AUTH_TOKEN`** (or **`TWILIO_API_KEY_SECRET`**). Replit Connectors still used if these are unset. |

---

## 5. **Google Sheets / Calendar** (implemented)

| Current | Change for new environment |
|--------|------------------------------|
| **Replit Connectors** | Use a Google service account when not on Replit. |
| **Files** | `server/googleSheets.ts`, `server/calendarService.ts`. |
| **Env** | Set **`GOOGLE_SERVICE_ACCOUNT_JSON`** (inline JSON string) or **`GOOGLE_SERVICE_ACCOUNT_KEY_PATH`** (path to key file). Replit Connectors still used if unset. |

---

## 6. **Email (SendGrid)** (implemented)

| Current | Change for new environment |
|--------|------------------------------|
| **SendGrid** via API key | No Replit dependency. |
| **Env** | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`. |
| **Base URL** | **`BASE_URL`** is used in `server/email.ts` for links (with `REPLIT_DOMAINS` fallback). |

---

## 7. **Unsubscribe / public links** (implemented)

| Current | Change for new environment |
|--------|------------------------------|
| **Base URL** | **`BASE_URL`** is used in `server/utils/unsubscribeToken.ts` and `server/utils/smsUnsubscribeToken.ts` (with Replit vars as fallback). |

---

## 8. **Vite / frontend** (implemented)

| Current | Change for new environment |
|--------|------------------------------|
| **Replit plugins** | Removed from `package.json` and `vite.config.ts`. Build no longer depends on Replit. |

---

## 9. **Startup order (what fails without env)**

The server will **exit** if these are missing:

1. **`DATABASE_URL`** – required by `server/db.ts`.
2. **`STRIPE_SECRET_KEY`** – required by `server/routes.ts`.

**Auth:** If **`OIDC_ISSUER_URL`** and **`OIDC_CLIENT_ID`** (or legacy **`REPL_ID`** + **`ISSUER_URL`**) are not set, the app still starts; `/api/login` returns 503.

**.env loading:** The server loads **`.env`** and **`.env.local`** at startup via `dotenv` (see `server/index.ts`).

---

## 10. **Quick reference**

| Area | Env / code | Action |
|------|------------|--------|
| Auth | `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `BASE_URL` | Set for any OIDC provider; optional to start. |
| DB | `DATABASE_URL` | Set; run `npm run db:push`. |
| Sessions | `SESSION_SECRET` + Postgres | No change. |
| Object storage | `OBJECT_STORAGE_PROVIDER=s3`, `S3_*` or `R2_*` | Set for S3/R2; else Replit GCS when on Replit. |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Set for direct Twilio; else Replit Connectors. |
| Google | `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Set for Sheets/Calendar; else Replit Connectors. |
| Email / links | `BASE_URL`, `SENDGRID_*` | Set `BASE_URL`; email uses it. |
| Vite | Replit plugins removed | No action. |

For step-by-step local run and deployment, see **RUN_LOCALLY.md**.
