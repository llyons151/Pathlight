# Pathlight account and legal setup

The multipage site and Supabase integration are implemented. The public Supabase connection is configured. Public business contact details and Google OAuth provider credentials still need configuration. Live account creation and email delivery have not been tested against a provider. This setup does not turn the analytics demo into a connected analytics product.

## Connect authentication

1. Create or use your Supabase project. In `site.config.json`, set `supabaseUrl` to its HTTPS project URL and `supabasePublishableKey` to its `sb_publishable_...` key. These are intentionally public. Never use a secret or service-role key. The build rejects unsupported key types.
2. Enable email/password authentication and email confirmations in Supabase. Set a minimum password length of 12 in the provider as well as the browser form. Configure abuse protection and provider rate limits appropriate for launch.
3. Set the Supabase Site URL to your deployed HTTPS origin. Add exact redirect URLs for `/auth/callback/` and `/reset-password/`, including the trailing slash. For development, add `http://localhost:5173/auth/callback/` and `http://localhost:5173/reset-password/` (or your chosen port). Avoid wildcard production redirects.
4. Configure a production email provider through Supabase's custom SMTP settings and verify the sender domain. Test confirmation and recovery delivery to real inboxes you control. Default test email delivery is not a production mail setup.
5. After the legal work below, build or restart the development server. Configuration is read at startup/build time.
6. Verify signup → email confirmation → account; login → logout; recovery email → new password → login; expired links; and provider rate limits. The automated tests cover request wiring, failures, session checks, routes, and source-file protection, not live email delivery.

This is a static, browser-based Supabase integration. The SDK verifies users against the provider before displaying account details. Sessions use `sessionStorage`, not local password storage. Closing the tab normally removes the stored session. Confirmation links can open a new tab because the client uses the implicit flow; it consumes tokens and removes the URL fragment before rendering account state. Account pages set a no-referrer policy.

The account HTML is a public shell, not a server authorization boundary. There is no private analytics database in this implementation. When adding one, enforce authorization in Supabase Row Level Security and/or the backend for every operation. Do not rely on client-side redirects. Signup acceptance is included in user metadata; that metadata is user-editable and is not an immutable legal acceptance audit record. A server-controlled acceptance record should be added if durable evidence is required.

Official implementation references:

- [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Finalize the legal documents

The legal pages are pre-launch drafts, not a determination that every law applicable to the business has been satisfied. They accurately describe the current preview, preset demo answers, external Google Fonts request, planned Supabase account processing, and browser session storage. They do not claim certifications, connected AI, a live analytics service, or paid subscriptions.

Fill `operatorName`, `jurisdiction`, `postalAddress`, and `contactEmail` in `site.config.json` with real public business details. Use an address suitable for public disclosure; it need not be a home address. These values appear in the generated documents and contact page. Confirm `policyVersion` before launch.

Review and tailor `site/pages.mjs` for:

- Operator identity, location, intended customer locations, and applicable consumer and privacy rules.
- Actual hosting and email processors, processing locations, retention durations, deletion workflow, international-transfer safeguards, and a working privacy request channel.
- Which privacy rights and statutory disclosures apply to the operator and audience. Avoid claiming an exhaustive universal set of required documents.
- Whether the business will offer B2B analytics processing that requires a data processing agreement, subprocessor list, and customer tracking/consent instructions. Those documents are not appropriate to fabricate before the processing architecture and vendors are known.
- Future billing terms, renewal, cancellation, and refund disclosures before offering paid accounts. This preview has no checkout or charges.
- Optional tracking consent before introducing nonessential cookies or storage where applicable. No marketing trackers are installed now, so there is no decorative consent banner that promises controls it does not implement.

Once the documents and operational practices have been reviewed for the actual business, set `legalReviewed` to `true`. Registration is controlled separately by `registrationOpen` in `site.config.json` and requires configured authentication. Set it to `true` to open email registration and Google sign-in, or `false` to close registration. The legal review flag controls the draft notices.

Sources used to scope the drafts:

- [FTC: Consumer Privacy](https://www.ftc.gov/business-guidance/privacy-security/consumer-privacy)
- [FTC: Privacy and Security](https://www.ftc.gov/business-guidance/privacy-security)
- [ICO: Cookies and privacy notices in detail](https://ico.org.uk/for-organisations/advice-for-small-organisations/privacy-notices-and-cookies/cookies-and-privacy-notices-in-detail/)

## Contact

Setting `contactEmail` enables a form that prepares a `mailto:` draft in the visitor's email client. It explicitly says the visitor must review and send the email there. No message is sent by the website and no email is sent by setup or tests. If a server-submitted contact form is needed later, connect an email service and add server-side validation, abuse protection, error handling, and corresponding privacy disclosures.

## Build and hosting

Use Node.js 22 or newer, `npm install`, then `npm run dev`. Run `npm test` for a production build and the route/auth checks. `npm run build` writes route directories and the bundled SDK to `dist/`. `npm run preview` serves that build.

Deploy only `dist/` to a static host, with directory index support for `/login/`, `/signup/`, `/forgot-password/`, `/reset-password/`, `/auth/callback/`, `/account/`, `/contact/`, `/terms/`, `/privacy/`, `/cookies/`, and `/acceptable-use/`. Do not route every URL back to the landing page. Configure HTTPS and security headers on the host; the local server's headers do not automatically transfer to static hosting. Recommended baseline headers match `scripts/server.mjs`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`. A production CSP should be scoped to the actual Supabase project, fonts, and existing inline demo styles.

The local server serves an explicit allowlist of site assets and pages. It does not expose `.env`, `.git`, source, or configuration files. Restart any server already running before these changes so the new routes become available.

Missing URLs return the styled 404 page with HTTP status 404 in the included server, including nested unknown paths and malformed URLs. `dist/404.html` is also generated for static hosts; configure the host to use it as the error document while preserving the 404 status.

## Google sign-in

The login and signup pages include Google OAuth using the existing `/auth/callback/` route. Google OAuth may create an account on first login, so both Google buttons respect `registrationReady`. Set `registrationOpen` to `true` with configured authentication to open registration. Google signup checks the terms checkbox; unlike email signup, OAuth does not currently record terms acceptance metadata.

1. In Google Auth Platform, configure branding, audience, and the `openid`, email, and profile scopes. Create a Web application OAuth client.
2. Add the development origin `http://localhost:5173` and your production origin under Authorized JavaScript origins.
3. Add `https://xgvkltgbommhxhtlgcud.supabase.co/auth/v1/callback` under Authorized redirect URIs.
4. In Supabase Authentication → Sign In / Providers → Google, enable Google and save the Google OAuth Client ID and Client Secret. Supabase API keys are not Google OAuth credentials.
5. In Supabase Authentication → URL Configuration, allow `http://localhost:5173/auth/callback/` and the production equivalent, and set Site URL to the production origin.
6. Rebuild/restart the app and test Continue with Google, the return to `/account/`, cancellation, and logout.

Only the publishable Supabase key belongs in site configuration. Rotate exposed privileged credentials in Supabase. No privileged keys are needed for this integration.

Reference: https://supabase.com/docs/guides/auth/social-login/auth-google

## Dashboard

Successful login and confirmation return to `/dashboard/`. The dashboard verifies the session with Supabase before revealing the workspace and redirects visitors without a valid session to `/login/`. Logout hides the workspace and clears the local session. Include `/dashboard/` in static hosting routes. Like the account page, the dashboard is a public HTML shell; private data must be authorized by the backend/RLS. Metrics are empty until a real analytics integration is implemented.
