# Production Architecture

## Azure Runtime

- Azure Static Web Apps hosts the Vite frontend.
- A linked Azure Function App hosts HTTP APIs and timer jobs.
- Cosmos DB stores profiles, listings, inquiries, orders, notifications, and refreshed public-data snapshots.
- The `public-data` snapshots are the low-cost cache for mandi prices and official updates; add Redis only when measured API latency or read volume justifies another paid service.
- Function App storage is required for timer leases and function host state.
- Application Insights should be enabled for Static Web Apps and Function App diagnostics.

Static Web Apps managed functions only support HTTP triggers. The scheduled refresh jobs in `api/src/functions/refreshPublicData.js` therefore deploy to a separate Azure Function App and the Function App must be linked as the Static Web Apps backend.

## Data Refresh

- `refreshMarketPrices` defaults to every 6 hours with `0 0 */6 * * *`.
- `refreshAgricultureUpdates` defaults to daily at 06:00 UTC with `0 0 6 * * *`.
- Both schedules are app settings and can be changed to 12-hour or daily cadence without code changes.
- HTTP public-data endpoints return cached Cosmos snapshots when available and fall back to official sources.

## Cosmos Containers

Create database `annadatha` with these containers:

| Container | Partition key |
| --- | --- |
| `profiles` | `/userId` |
| `listings` | `/sellerId` |
| `inquiries` | `/id` |
| `orders` | `/userId` |
| `notifications` | `/userId` |
| `otp-challenges` | `/phone` |
| `public-data` | `/id` |

## Authentication

Production frontend disables demo seeds and starts from Static Web Apps hosted authentication. `/login`, `/signup`, `/forgot-password`, and `/reset-password` route to the configured Static Web Apps provider. APIs accept the `x-ms-client-principal` identity header forwarded by Static Web Apps.

The repository intentionally does not store farmer passwords or password-reset tokens. Use Entra External ID for customer sign-up, sign-in, and self-service password reset, then keep Static Web Apps forwarding the authenticated principal to the linked Function App. The app profile setup remains separate so farm location and crop preferences stay in Cosmos under the app identity.

For minimum-cost launch, hosted Static Web Apps authentication remains the production entry point and notifications are stored in Cosmos for in-app polling. That path does not need SMS for every notification.

Optional farmer phone OTP endpoints are available at `/api/otp/request` and `/api/otp/verify`. Set `OTP_PROVIDER=azure-communication-services`, `OTP_HASH_SECRET`, `ACS_CONNECTION_STRING`, and `ACS_SMS_FROM` only after an Azure Communication Services SMS sender is provisioned. OTP challenges are HMAC-hashed, expire after five minutes, and require Cosmos TTL on `otp-challenges`. Add rate limiting and abuse monitoring at the edge before public OTP traffic.

`NOTIFICATION_DELIVERY_MODE=in-app` is the low-budget default. Keep inquiry and reply notifications in the `notifications` container first; add SMS or push fan-out only for events that need off-app delivery and after user consent is collected.

## CI/CD Secrets

Static Web Apps workflow:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`

Function App workflow:

- `AZURE_FUNCTIONAPP_NAME`
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

Function App settings:

- `COSMOS_CONNECTION_STRING`
- `COSMOS_DATABASE_ID`
- `DATA_GOV_IN_API_KEY`
- `AzureWebJobsStorage`
- optional `OTP_PROVIDER`, `OTP_HASH_SECRET`, `ACS_CONNECTION_STRING`, and `ACS_SMS_FROM`
- `NOTIFICATION_DELIVERY_MODE` defaults to `in-app`
- optional refresh schedules from `api/local.settings.sample.json`

Static Web App settings for External ID custom authentication:

- OIDC client ID app setting.
- OIDC client secret app setting.
- External ID OIDC well-known configuration URL in `staticwebapp.config.json`.
- Static Web Apps callback URL registered in the External ID app registration.
