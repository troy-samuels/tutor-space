# Google Calendar OAuth Runbook

## Symptom
- "Access blocked: authorization error - the OAuth client wasn't found."

## What this means
The Google OAuth client ID in use does not exist in the Google Cloud project, was deleted, or is not the one configured for this environment. This can also happen when the wrong `.env.local` file is edited (the Next app reads `app/.env.local`).

## Fix checklist
1. Confirm the correct env file and deployment target.
   - Local dev: update `app/.env.local` (not the repo root `.env.local`).
   - Production: update the environment variables in your hosting provider and redeploy.

2. Verify Google Cloud project + OAuth client.
   - Google Cloud Console -> APIs & Services -> Credentials.
   - Create an "OAuth client ID" of type "Web application".
   - Copy the **Client ID** and **Client Secret**.

3. Enable Google Calendar API + consent screen.
   - APIs & Services -> Library -> enable "Google Calendar API".
   - Configure OAuth consent screen (External/Production as needed).
   - If the app is in testing mode, add test users.

4. Set the correct redirect URIs.
   - Add all environments you use:
     - `http://localhost:3000/api/calendar/oauth/google`
     - `https://YOUR_DOMAIN/api/calendar/oauth/google`
   - If you use a custom redirect, set `GOOGLE_OAUTH_REDIRECT_URL`.

5. Update environment variables.
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_OAUTH_REDIRECT_URL` (optional override)
   - `CALENDAR_TOKEN_ENCRYPTION_KEY` (must remain stable across deploys)

6. Re-test the flow.
   - Trigger `POST /api/admin/health/check` to confirm the calendar config is healthy.
   - Retry the Calendar connect step during onboarding.

## Common pitfalls
- Editing the root `.env.local` instead of `app/.env.local`.
- Using an OAuth client for iOS/Android/Desktop instead of Web.
- Missing or incorrect redirect URI in the Google Cloud OAuth client.
- App still in "Testing" without the user added as a test user.
- Secrets pasted with extra quotes or whitespace.

## Operational guidance
- If you rotate the OAuth client ID/secret, revoke and reconnect any existing calendar connections.
- Keep `CALENDAR_TOKEN_ENCRYPTION_KEY` stable to avoid losing the ability to decrypt stored tokens.
