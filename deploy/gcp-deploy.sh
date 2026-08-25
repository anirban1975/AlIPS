#!/usr/bin/env bash
# Deploy the AlIPS Math app to Google Cloud (Firebase Hosting).
#
# Designed to be run in Google Cloud Shell, where gcloud and Node.js are
# already installed and you are already signed in to your Google account.
#
#   bash deploy/gcp-deploy.sh                 # interactive, picks/creates a project
#   bash deploy/gcp-deploy.sh my-project-id   # deploy to a specific project
#
# Free tier: Firebase Hosting's Spark plan covers this app many times over.

set -euo pipefail

BOLD=$'\033[1m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; OFF=$'\033[0m'
say()  { printf "%s\n" "${BOLD}$*${OFF}"; }
ok()   { printf "%s\n" "${GREEN}✓ $*${OFF}"; }
warn() { printf "%s\n" "${YELLOW}! $*${OFF}"; }
die()  { printf "%s\n" "${RED}✗ $*${OFF}" >&2; exit 1; }

command -v gcloud >/dev/null || die "gcloud not found. Run this in Google Cloud Shell: https://shell.cloud.google.com"
[ -f index.html ] || die "Run this from the repository root (index.html not found)."

# ---------------------------------------------------------------- project ---
PROJECT_ID="${1:-}"

if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
  [ "$PROJECT_ID" = "(unset)" ] && PROJECT_ID=""
fi

if [ -z "$PROJECT_ID" ]; then
  say "No project selected. Your Google Cloud projects:"
  gcloud projects list --format="table(projectId,name)" || true
  echo
  read -rp "Enter a project ID to use, or a NEW id to create (e.g. alips-math): " PROJECT_ID
  [ -n "$PROJECT_ID" ] || die "A project ID is required."
fi

if gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  ok "Using existing project: $PROJECT_ID"
else
  say "Creating project $PROJECT_ID …"
  gcloud projects create "$PROJECT_ID" --name="AlIPS Math" \
    || die "Could not create '$PROJECT_ID'. The id may be taken — try another, or create the project in the console first."
  ok "Project created"
fi

gcloud config set project "$PROJECT_ID" >/dev/null
say "Enabling the Firebase API (first run only, ~30s) …"
gcloud services enable firebase.googleapis.com --project "$PROJECT_ID" >/dev/null 2>&1 \
  || warn "Could not enable the API automatically — continuing; Firebase may enable it for you."

# --------------------------------------------------------------- firebase ---
FIREBASE="npx --yes firebase-tools@13"
command -v firebase >/dev/null && FIREBASE="firebase"

say "Adding Firebase to the project (skipped if already added) …"
$FIREBASE projects:addfirebase "$PROJECT_ID" >/dev/null 2>&1 \
  && ok "Firebase enabled on $PROJECT_ID" \
  || warn "Firebase already enabled, or needs to be enabled once at https://console.firebase.google.com"

printf '{\n  "projects": {\n    "default": "%s"\n  }\n}\n' "$PROJECT_ID" > .firebaserc
ok "Wrote .firebaserc"

say "Deploying to Firebase Hosting …"
$FIREBASE deploy --only hosting --project "$PROJECT_ID"

echo
ok "Deployed."
say "Your app is live at:"
echo "    https://${PROJECT_ID}.web.app"
echo "    https://${PROJECT_ID}.firebaseapp.com"
echo
echo "Pages:"
echo "    https://${PROJECT_ID}.web.app/            (curriculum browser)"
echo "    https://${PROJECT_ID}.web.app/worksheets  (worksheets & exams)"
echo "    https://${PROJECT_ID}.web.app/learn       (practice & learn)"
echo
echo "To deploy an update later:  git pull && bash deploy/gcp-deploy.sh ${PROJECT_ID}"
echo "To add a school domain:     Firebase console → Hosting → Add custom domain"
