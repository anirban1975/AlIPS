# Deploying the AlIPS Math App to Google Cloud

The app is a static site (HTML/CSS/JS, no server), so the best-fit Google
service is **Firebase Hosting** — it's part of Google Cloud, has a generous
free tier that this app will never exceed, serves over HTTPS, and gives you a
URL like `https://alips-math.web.app`.

> Already live for free at: https://anirban1975.github.io/AlIPS/
> Use this guide only if the school prefers hosting on Google's cloud.

## Option A — Firebase Hosting (recommended)

**One-time setup (about 15 minutes):**

1. Install Node.js from https://nodejs.org if you don't have it.
2. Install the Firebase tools. In a terminal:
   ```
   npm install -g firebase-tools
   ```
3. Sign in with the school's Google account:
   ```
   firebase login
   ```
4. Create a project at https://console.firebase.google.com — click
   **Add project**, name it `alips-math`, and disable Analytics (not needed).
5. In the folder containing the app files (`index.html`, `styles.css`,
   `data.js`, `app.js`) run:
   ```
   firebase init hosting
   ```
   Answers: use existing project → `alips-math`; public directory → `.`
   (a single dot, meaning "this folder"); single-page app → `No`;
   set up automatic builds → `No`; overwrite index.html → **No** (important).

**Deploying (every time, 30 seconds):**

```
firebase deploy --only hosting
```

The command prints your live URL, e.g. `https://alips-math.web.app`.
You can attach a custom school domain later under Hosting → Add custom domain.

Cost: free. The free tier includes 10 GB storage and 360 MB/day transfer —
far more than this app uses.

## Option B — Google Cloud Storage bucket

Works, but is more fiddly than Firebase (HTTPS on a custom domain requires
setting up a load balancer, which costs ~USD 18/month). Only choose this if
your IT policy requires plain GCP:

1. Create a project at https://console.cloud.google.com and enable billing.
2. Create a bucket (Cloud Storage → Create bucket), uncheck
   "Enforce public access prevention".
3. Upload `index.html`, `styles.css`, `data.js`, `app.js`.
4. Grant public read: bucket → Permissions → Grant access →
   principal `allUsers`, role `Storage Object Viewer`.
5. Bucket → Edit website configuration → main page `index.html`.
6. The site is served at
   `https://storage.googleapis.com/YOUR-BUCKET-NAME/index.html`.

## Which to choose

| | GitHub Pages (current) | Firebase Hosting | Cloud Storage |
|---|---|---|---|
| Cost | Free | Free | Free-ish; HTTPS custom domain ~$18/mo |
| Setup effort | Done | ~15 min once | ~30 min |
| Custom domain + HTTPS | Yes, free | Yes, free | Needs load balancer |
| Auto-deploy from GitHub | Yes | Possible (extra setup) | No |

Recommendation: stay on GitHub Pages until the school needs a custom domain
or Google-account-based access control; then move to Firebase Hosting.
