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
3. Run `setupSheets()` once and approve the requested spreadsheet permissions. It creates the `INVITATIONS`, `INVITED_GUESTS`, and `RSVP_RESPONSES` sheets with the documented header columns. When upgrading the RSVP flow, setup removes existing `Companion` guest rows and their responses, retaining each primary guest; companions are entered by guests when they RSVP. This migration runs once.
4. In **Project Settings → Script properties**, set:
   - `ADMIN_PASSWORD`: a unique password with at least 16 characters.
5. Add invitation rows to `INVITATIONS` and one `Primary Guest` row to `INVITED_GUESTS`. Invitation codes may be reused across multiple invitations; each invitation still has its own ID. `Family Guest` invitations allow up to 3 people total (the named guest plus 2 companions); if one companion is already listed, the invitee can add only one more. Other invitation types allow up to 2 people total. The admin screen sets the seat limit from the guest type. The public RSVP endpoint closes after 11:59 PM Philippine time on November 30, 2026, and the service caps accepted attendance at 60 people.
6. Deploy as **Web app**, execute as the spreadsheet owner, and allow access to anyone. The public web app permits name lookup, invitation verification, and RSVP submissions for code-verified invitations. All admin actions require the password checked by Apps Script. Never put the spreadsheet ID, Apps Script credentials, or admin password in a frontend environment variable.
7. Copy the deployment's `/exec` URL into `VITE_GOOGLE_APPS_SCRIPT_URL`. After changing Apps Script code, deploy a new version of the web app. If RSVP submission says `Please submit a response for every invited guest.`, the web app is still running the older per-guest RSVP code: copy the current `google-apps-script/Code.gs` into Apps Script, save it, then edit the web app deployment and select **New version**. Keep the existing `/exec` URL.

`invitation_code` is treated as a private bearer code: the lookup endpoint never returns it. The same code may be shared across invitation parties, so anyone holding it can verify or submit/update RSVPs for any invitation paired with that code. Anyone who knows a guest name can discover that a matching invitation exists. Share codes privately and keep them out of public guest lists.

### Apps Script API behavior

- `GET ?action=lookup&q=...` returns up to ten matching invitation summaries, matching primary or accompanying guest names case-insensitively.
- `POST action=verify_invitation` checks the invitation code before returning the invitation's guest list and any previously registered companion.
- `POST action=submit_rsvp` requires a valid code, an accept-or-decline choice for the primary guest, and one mobile number when attending. Each already-registered companion must also have an explicit accept-or-decline choice and may attend even if the primary guest declines. An accepting guest may add any remaining companions allowed by the invitation; each name is submitted separately and comma-separated names are rejected. New companions are recorded as attending. The service counts each accepted person toward the 60-person cap and rejects submissions after the fixed Philippine-time deadline.
- Admin actions (`admin_dashboard`, `admin_create_invitation`, `admin_edit_invitation`, `admin_set_companion`, `admin_remove_guest`, and `admin_delete_invitation`) are checked against the server-side `ADMIN_PASSWORD` property. `Family Guest` invitations allow up to two companions; other invitations allow up to one. Adding or renaming a guest does not confirm attendance; the invitee records each person’s response through the RSVP form. These actions are never exposed via GET.
- Admin dashboard responses include the mobile number supplied for each invitation; keep the admin password private and only use it over HTTPS.

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

The public API does not include an endpoint to enumerate invitations or guest records. Name lookup returns only matching invitation summaries. The guest list is returned only after code verification. Guest IDs, the one-companion limit, and the 60-seat cap are revalidated on every RSVP write. The admin screen is a separate `/admin` route and relies on server-side Apps Script password validation rather than frontend-only gating.
# rsvp
