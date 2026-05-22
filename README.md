# AnnadathaBazar

AnnadathaBazar is a Vite React farmer marketplace with a Static Web Apps frontend and a linked Azure Function App backend.

## Environments

- Local development: `npm install`, `npm install --prefix api`, then `npm run dev`.
- Local URL: `http://127.0.0.1:3000/`.
- Production frontend: Azure Static Web Apps builds `dist`.
- Production API: link the dedicated Azure Function App in `api` as the Static Web Apps backend so `/api` reaches it.

Tracked Vite environment files keep the frontend API contract stable:

- `.env.development` uses `/api` through the Vite local middleware.
- `.env.production` uses `/api` through the linked Function App and disables demo data.

Set `DATA_GOV_IN_API_KEY` in Function App settings for production data.gov.in access. Browser-only development can optionally set `VITE_DATA_GOV_IN_API_KEY`; the app otherwise uses data.gov.in's public test key as a direct fallback when the local Node proxy cannot reach data.gov.in.

## Data Sources

- Live mandi prices come from the Government of India data.gov.in AGMARKNET resource through `/api/market-prices`.
- Official agriculture updates come from Press Information Bureau RSS through `/api/agriculture-updates`.
- Scheme cards link to official PM-KISAN, PMFBY, and Soil Health Card portals.

The app does not replace failed public-data requests with invented prices or news. It shows loading, empty, or unavailable states instead.

## Production Backend

Production starts from hosted Static Web Apps authentication and never initializes marketplace listing, order, inquiry, or notification seed data. The Function App has HTTP endpoints for profiles, listings, inquiries/messages, and notifications backed by Cosmos DB.

The hosted account entry exposes `/login`, `/signup`, `/forgot-password`, and `/reset-password`. Production sends those routes to the Entra External ID customer sign-up/sign-in user flow configured in `docs/customer-authentication.md`. Do not add app-managed password storage to this frontend or Function App.

Scheduled public-data refresh jobs live in the Function App:

- Mandi prices: every 6 hours by default.
- Agriculture updates: daily by default.

The schedules are app settings, so Azure can switch them to 12-hour or daily cadence without a frontend deploy. See `docs/production-architecture.md` for containers, partition keys, authentication, and secrets.

## Deployment

The GitHub Action in `.github/workflows/azure-static-web-apps.yml` lints, builds, and deploys `dist`. The Azure deployment token must be present as `AZURE_STATIC_WEB_APPS_API_TOKEN`.

The Function App deploy workflow in `.github/workflows/azure-functions.yml` deploys `api` separately. This separation is required because timer triggers are not supported in Static Web Apps managed functions.

## Current Architecture Boundary

Listings, profiles with GPS coordinates, inquiry messages, in-app notifications, and optional Azure Communication Services OTP endpoints now have backend endpoints. Production hardening includes Cosmos-backed write/OTP rate limits, Application Insights, Azure Monitor launch alerts, and continuous-backup migration. Production work still needed before broad public launch: verify External ID password reset with a real customer account, finish SMS sender approval before enabling phone OTP, add Blob Storage upload/SAS flow, moderation workflows, order/payment lifecycle, real weather provider, a restore drill, and load/security testing.
