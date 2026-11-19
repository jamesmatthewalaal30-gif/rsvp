# Nate & Kym wedding RSVP

A React + Vite wedding site with a private, per-invitation guest lookup and RSVP flow. Google Apps Script is the only data API; the static frontend does not contain a guest database or Google credentials.

## Local development

1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env.local` and set `VITE_GOOGLE_APPS_SCRIPT_URL` to the deployed Apps Script web app URL.
3. Run `npm install`, then `npm run dev`.
4. Run `npm run build` to create the production files in `dist`.

The site can be viewed without a configured API, but lookup and RSVP actions will show a setup message rather than use mock guest data.

## Google Sheets and Apps Script

1. Create a Google spreadsheet and open **Extensions → Apps Script** from that spreadsheet. This keeps the spreadsheet ID out of the frontend.
2. Copy `google-apps-script/Code.gs` into the bound Apps Script project.
3. Run `setupSheets()` once and approve the requested spreadsheet permissions. It creates the `INVITATIONS`, `INVITED_GUESTS`, and `RSVP_RESPONSES` sheets with the documented header columns. If the responses sheet has the old `dietary_restrictions` column, setup removes it and its stored values.
4. In **Project Settings → Script properties**, set:
   - `ADMIN_PASSWORD`: a unique password with at least 16 characters.
   - `RSVP_DEADLINE`: optional ISO date/time, for example `2026-11-25T23:59:00+08:00`. Leave unset to allow response updates until the event.
5. Add invitation rows to `INVITATIONS` and their individual members to `INVITED_GUESTS`. Each invitation code must be unique. Include exactly one `Primary Guest` and no more than one `Companion` (two invited guests total). `allocated_seats` must equal the number of rows for that invitation.
6. Deploy as **Web app**, execute as the spreadsheet owner, and allow access to anyone. The public web app only permits name lookup and invitation-code verification; RSVP writes are restricted to the verified invitation's existing guest IDs. All admin actions require the password checked by Apps Script. Never put the spreadsheet ID, Apps Script credentials, or admin password in a frontend environment variable.
7. Copy the deployment's `/exec` URL into `VITE_GOOGLE_APPS_SCRIPT_URL`. After changing Apps Script code, deploy a new version of the web app.

`invitation_code` is treated as a private bearer code: the lookup endpoint never returns it. Share a unique code with each invitation party and keep it out of public guest lists. Anyone who knows a guest name can discover that a matching invitation exists, but must also know its code to see its complete guest list or submit/update RSVPs.

### Apps Script API behavior

- `GET ?action=lookup&q=...` returns up to ten matching invitation summaries, matching primary or accompanying guest names case-insensitively.
- `POST action=verify_invitation` checks the invitation code before returning the invitation's complete guest list.
- `POST action=submit_rsvp` requires a valid code and one valid attendance status for every invited guest, rejects unknown/duplicate guest IDs, enforces seat-count integrity and the optional deadline, then inserts or updates one response per person.
- Admin actions (`admin_dashboard`, `admin_create_invitation`, `admin_edit_invitation`, `admin_add_guest`, `admin_remove_guest`, and `admin_delete_invitation`) are checked against the server-side `ADMIN_PASSWORD` property. They are never exposed via GET.
- Admin dashboard responses include optional contact numbers; keep the admin password private and only use it over HTTPS.

## Render deployment

### Recommended: Render Static Site

Connect the repository to Render and create a **Static Site**. `render.yaml` configures:

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- SPA fallback rewrite to `/index.html`
- `VITE_GOOGLE_APPS_SCRIPT_URL` as a build-time environment variable

Set the endpoint in Render's environment settings, then redeploy. Vite embeds `VITE_*` values in the public build: only the Apps Script endpoint belongs here, never a secret.

### Optional: Docker-based Render Web Service

The `Dockerfile` builds the Vite app and serves its static output through Nginx on Render's `$PORT`-compatible port `10000`; `nginx.conf` provides SPA fallback and static asset caching. Create a Render **Web Service** using the Docker runtime and set the `VITE_GOOGLE_APPS_SCRIPT_URL` build argument/environment value before deployment. This is an alternative to a Static Site, not a way to run Docker on a Render Static Site.

## RSVP data privacy

The public API does not include an endpoint to enumerate invitations or guest records. Name lookup returns only matching invitation summaries. The full invitation and guest list is returned only after code verification. Guest IDs and seat counts are revalidated on every RSVP write. The admin screen is a separate `/admin` route and relies on server-side Apps Script password validation rather than frontend-only gating.
# rsvp
