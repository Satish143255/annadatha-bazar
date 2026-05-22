# Customer Authentication

## Boundary

AnnadathaBazar uses Azure Static Web Apps hosted authentication. The frontend and Function App must not collect, hash, email, or reset farmer passwords themselves. The Function App trusts the `x-ms-client-principal` header that Static Web Apps forwards after the identity provider completes authentication.

Production account entry routes are:

| Route | Purpose |
| --- | --- |
| `/login` | Existing-account sign in |
| `/signup` | New-account entry |
| `/forgot-password` | Forgotten-password entry |
| `/reset-password` | Reset-password entry |

The managed Static Web Apps Microsoft Entra provider currently receives all four routes. That is enough for Microsoft account sign-in, but app-specific email/password signup and self-service password reset need a customer identity provider.

## Recommended Azure Setup

Use Microsoft Entra External ID for public customer accounts:

1. Create or select an External ID tenant.
2. Register the Static Web App application in that tenant.
3. Create a customer sign-up and sign-in user flow with `Email with password`.
4. Enable self-service password reset for that app/user flow.
5. Add the application to the user flow.
6. Add the Static Web Apps callback URL to the app registration:

   `https://<STATIC_WEB_APP_HOST>/.auth/login/entraExternalId/callback`

7. Add the External ID client ID and client secret as Static Web App application settings.
8. Replace the managed `aad` account routes in `staticwebapp.config.json` with the custom provider route after the External ID provider is configured.

Use a provider block like this in `staticwebapp.config.json`, replacing the discovery URL and app-setting names for the External ID tenant:

```json
{
  "auth": {
    "identityProviders": {
      "customOpenIdConnectProviders": {
        "entraExternalId": {
          "registration": {
            "clientIdSettingName": "ENTRA_EXTERNAL_ID_CLIENT_ID",
            "clientCredential": {
              "clientSecretSettingName": "ENTRA_EXTERNAL_ID_CLIENT_SECRET"
            },
            "openIdConnectConfiguration": {
              "wellKnownOpenIdConfiguration": "https://<EXTERNAL_ID_ISSUER>/.well-known/openid-configuration"
            }
          },
          "login": {
            "nameClaimType": "name",
            "scopes": ["openid", "profile", "email"]
          }
        }
      }
    }
  }
}
```

After that provider is active, route `/login`, `/signup`, `/forgot-password`, and `/reset-password` to:

`/.auth/login/entraExternalId`

External ID renders the secure signup, sign-in, and password-reset pages. AnnadathaBazar renders the account entry and app profile setup around those pages.

## OTP

Phone OTP in this repository is a separate phone verification path, not a replacement for password reset. It stays disabled until an Azure Communication Services SMS sender and these Function App settings exist:

- `OTP_PROVIDER=azure-communication-services`
- `OTP_HASH_SECRET`
- `ACS_CONNECTION_STRING`
- `ACS_SMS_FROM`

Before public OTP traffic, add edge throttling, SMS abuse monitoring, user consent copy, and a tested resend/attempt limit policy.
