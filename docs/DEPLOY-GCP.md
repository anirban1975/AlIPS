# Deploying the AlIPS Math App to Google Cloud

The app is a static site (HTML/CSS/JS, no server), so the best fit on Google
Cloud is **Firebase Hosting**: free tier, HTTPS included, custom domains
supported, and no billing account required.

## The one-click way (recommended, ~3 minutes)

Open this link. Google Cloud Shell starts in your browser, already signed in
to your Google account, with this repository cloned and a step-by-step
tutorial in the side panel:

**[▶ Open in Google Cloud Shell](https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fanirban1975%2FAlIPS&cloudshell_git_branch=gh-pages&cloudshell_workspace=.&cloudshell_tutorial=docs%2FCLOUDSHELL.md)**

Then run one command:

```bash
bash deploy/gcp-deploy.sh
```

It lists your Google Cloud projects, lets you pick one (or type a new id such
as `alips-math` to create it), enables Firebase, uploads the app, and prints
your live address — something like `https://alips-math.web.app`.

Nothing to install: Cloud Shell already has `gcloud` and Node.js.

## Deploying an update later

Back in Cloud Shell:

```bash
git pull && bash deploy/gcp-deploy.sh
```

## From your own computer instead

If you would rather not use Cloud Shell:

```bash
npm install -g firebase-tools     # once
firebase login                    # once
firebase deploy --only hosting --project YOUR-PROJECT-ID
```

`firebase.json` in this repository already contains the hosting configuration,
so no `firebase init` is needed.

## Adding a school domain

Firebase console → your project → **Hosting** → **Add custom domain** →
enter e.g. `math.alinjaz.edu.om`. Firebase issues a free HTTPS certificate;
your IT team adds the two DNS records it shows.

## Alternative: Cloud Storage bucket

Possible, but weaker for this use: HTTPS on a custom domain needs a load
balancer (~USD 18/month), and there is no atomic deploy or rollback.

1. Create a bucket in Cloud Storage; uncheck "Enforce public access prevention".
2. Upload the site files (all `.html`, `.css`, `.js`, `letterhead.png`).
3. Permissions → Grant access → principal `allUsers`, role
   `Storage Object Viewer`.
4. Edit website configuration → main page `index.html`.
5. Served at `https://storage.googleapis.com/YOUR-BUCKET/index.html`.

## Which host to use

| | GitHub Pages (live now) | Firebase Hosting | Cloud Storage |
|---|---|---|---|
| Cost | Free | Free (Spark plan) | Free-ish; HTTPS custom domain ~$18/mo |
| Setup | Already done | ~3 min via Cloud Shell | ~30 min |
| Custom domain + HTTPS | Yes, free | Yes, free | Needs a load balancer |
| Rollback | Git revert | One click in console | None |
| Inside Google Cloud | No | Yes | Yes |

Both can run at once — GitHub Pages as the always-on copy, Firebase as the
school's official address.
