# The Leaderboard — Cloud version (Vercel)

This is your Clubhouse recognition board, upgraded so **every device sees the same live board**.
Managers update from any phone or laptop; teammates view (and nominate) from theirs. Updates appear
everywhere within a few seconds — no shared screen required.

It keeps every feature: tiers, callouts, teammate view, the Wall, Recent feed, pre-shift huddle,
peer nominations + approval queue, per-action activity log, the owner-only Managers/codes tab, QR,
and print. If the internet drops, it automatically falls back to saving on that one device.

---

## What's in this folder
```
index.html        the app (front end)
api/board.js      read the board + save changes (manager-PIN protected)
api/nominate.js   let teammates submit a nomination (no PIN)
api/_redis.js     database connection
package.json      one dependency (@upstash/redis)
Clubhouse-Leaderboard-Roster.json   your 42 teammates + 7 managers (to bulk-load once)
```

---

## Deploy it (about 20–30 minutes, free)

You'll create two free things: a **Vercel** account (hosting) and a **Redis** database (storage).
No coding. Two ways to do the deploy — pick one.

### Option A — Vercel website + GitHub (no terminal)
1. Make a free account at **github.com**, click **New repository**, name it `clubhouse-leaderboard`,
   and upload every file in this folder (keep the `api/` folder as a folder).
2. Make a free account at **vercel.com** and click **Add New… → Project → Import** your GitHub repo.
   Leave all settings default and click **Deploy**. You'll get a live URL like
   `https://clubhouse-leaderboard.vercel.app`.
3. Add the database (below).

### Option B — Vercel CLI (a few terminal commands)
1. Install Node.js from **nodejs.org** (LTS).
2. In this folder, run:
   ```
   npm install -g vercel
   vercel
   ```
   Answer the prompts (accept defaults). It deploys and prints your live URL.
3. Add the database (below), then run `vercel --prod` to redeploy.

### Add the database (both options)
1. In your Vercel project, open the **Storage** tab → **Create Database** → choose
   **Redis** (marketplace/**Upstash**) → **Continue**, and **connect it to this project**.
   Vercel automatically adds the connection keys to your project — you don't copy anything.
2. **Redeploy** so the app picks up the database:
   - Option A: Vercel → **Deployments** → the latest one → **⋯ → Redeploy**.
   - Option B: run `vercel --prod`.

That's it — your live URL is now a synced board.

---

## First-time setup (5 minutes, once)
1. Open your live URL. You'll see the 42 teammates at the tee box, and a **● Live** badge under the title.
2. Click **Manager → "Set up the first manager"** → enter your name (Sheila) and a PIN. You're now the **owner**.
3. Load the rest of the managers in one shot: **Manager → Backup / Restore → Restore from file… →**
   pick **`Clubhouse-Leaderboard-Roster.json`**. This loads all 7 managers.
   *(Or skip the file and add each manager by hand in the owner **Managers** tab.)*
4. Have each manager change their PIN (owner **Managers** tab → **Change PIN**, or they do it after unlocking).
5. Make a **QR poster**: top bar **Share → Print QR**. Put the live URL / QR in the break room.

Then just share the live URL with the team. Teammates land in view-only and can hit **Nominate**.

---

## Good to know
- **Live, not instant:** other devices refresh every ~7 seconds. Plenty fast for a shift.
- **Codes stay private:** manager PINs are only ever sent to the owner's screen. Teammates and other
  managers never receive them, even in the page source.
- **Costs:** Vercel + Upstash free tiers are far more than a restaurant team will use.
- **Backups still matter:** use **Backup → Save backup** now and then. The database is durable, but a
  weekly export is cheap insurance.
- **Custom web address (optional):** Vercel → project **Settings → Domains** to use your own domain.

## If something's off
- Board shows **● Offline**: the database isn't connected yet — finish "Add the database" and redeploy.
- A manager PIN won't unlock: confirm it in the owner **Managers** tab (Show codes).
- Everything else works but doesn't sync: make sure you **redeployed** after adding the database.
