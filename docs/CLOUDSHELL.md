# Deploy the AlIPS Math app to Google Cloud

This tutorial deploys the app to **Firebase Hosting**, part of Google Cloud.
It takes about three minutes and stays inside the free tier.

You are already signed in to Google Cloud in this window — there is nothing
to install.

## Step 1: Run the deploy script

Click the button to copy the command into the terminal, then press **Enter**:

```bash
bash deploy/gcp-deploy.sh
```

The script will:

1. show your existing Google Cloud projects,
2. ask which project to use (type a new id such as `alips-math` to create one),
3. enable Firebase on that project,
4. upload the app.

If Cloud Shell asks **"Authorize"**, click **Authorize** — that is Cloud Shell
asking permission to use your own account.

## Step 2: Open your live site

When the script finishes it prints your address. It will look like:

```
https://alips-math.web.app
```

Open it and check the three pages:

- `/` — curriculum browser
- `/worksheets` — worksheet and exam generator
- `/learn` — practice and guided learning

## Step 3 (optional): Use a school domain

In the [Firebase console](https://console.firebase.google.com) choose your
project → **Hosting** → **Add custom domain**, and enter something like
`math.alinjaz.edu.om`. Firebase issues the HTTPS certificate free of charge.
Your IT team adds the two DNS records Firebase shows you.

## Deploying an update later

Come back to Cloud Shell and run:

```bash
git pull && bash deploy/gcp-deploy.sh
```

## Cost

Firebase Hosting's free **Spark** plan includes 10 GB of storage and 360 MB of
transfer per day. This app is under 1 MB, so a whole school using it daily
stays inside the free tier. No billing account is required.

## If something goes wrong

| Message | What to do |
|---|---|
| `Project id already exists` | That id is taken globally — try `alips-math-om` or similar. |
| `Permission denied` / `caller does not have permission` | Your Google account needs the **Editor** or **Owner** role on the project. |
| `Firebase already enabled` | Harmless — the script continues. |
| Script cannot create a project | Create one at [console.cloud.google.com](https://console.cloud.google.com), then run `bash deploy/gcp-deploy.sh YOUR-PROJECT-ID`. |

The app is also live on GitHub Pages at
<https://anirban1975.github.io/AlIPS/> — that copy keeps working regardless of
what happens here.
