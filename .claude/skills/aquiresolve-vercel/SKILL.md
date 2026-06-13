---
name: aquiresolve-vercel
description: Deploy and manage the AquiResolve admin dashboard on Vercel — production deploys, listing/adding/removing environment variables, and the FIREBASE_SERVICE_ACCOUNT double-encoding fix. Use whenever you need to ship dashboard_admin/ to production, change Vercel env vars, or debug "Login master indisponível"/Firebase Admin init errors on Vercel. There is NO GitHub auto-deploy — production ships only via the CLI.
---

# AquiResolve — Vercel (admin dashboard)

The Next.js 15 dashboard (`dashboard_admin/`) is hosted on Vercel.

- **Account:** `alvaro209890` (team `alvaro209890s-projects`)
- **Project:** `aquiresolve-dashboard` (linked via `dashboard_admin/.vercel/project.json`)
- **Production URL:** https://aquiresolve-dashboard.vercel.app
- **No GitHub integration** → pushing to `main` does **not** deploy. Production ships only via `vercel deploy --prod`.

## Setup every time

The Vercel CLI is **not** installed globally — use `npx -y vercel@latest`, and it **requires Node ≥ 20** (`@vercel/blob` engine). The PC default is Node 18, so always:

```bash
cd /home/acer/Documentos/app/dashboard_admin
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; nvm use 20 >/dev/null 2>&1
node -v   # expect v20.x
```

Auth is cached at `~/.local/share/com.vercel.cli/auth.json` — `npx -y vercel@latest whoami` should print `alvaro209890`. If not, `npx -y vercel@latest login` (interactive — ask the user to run it via `! vercel login`).

## Deploy to production

```bash
cd dashboard_admin   # must be the linked dir (.vercel/ present)
npx -y vercel@latest deploy --prod --yes
```
Success ends with `readyState: "READY"`, `target: "production"`, and the alias `https://aquiresolve-dashboard.vercel.app`. Vercel runs `next build` server-side; if it fails, run `npx next build` locally first (also Node 20) to see errors.

Smoke test:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://aquiresolve-dashboard.vercel.app/dashboard/servicos/catalogo-app   # 200
curl -s -o /dev/null -w "%{http_code}\n" https://aquiresolve-dashboard.vercel.app/master                              # 200
```

## Environment variables

List (names only — values stay encrypted):
```bash
npx -y vercel@latest env ls production
```
Expected set (14, verified 2026-06-13): `FIREBASE_SERVICE_ACCOUNT`, `NEXT_PUBLIC_FIREBASE_*` (API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID, MEASUREMENT_ID, DATABASE_URL), `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`(+`_ANDROID`), `ID_PUBLIC_PAGARME`, `API_KEY_PUBLIC_PAGARME`, `API_KEY_PRIVATE_PAGARME`.

Add a simple var:
```bash
printf 'the-value' | npx -y vercel@latest env add SOME_KEY production
```
After changing env vars, **redeploy** (`vercel deploy --prod --yes`) for them to take effect.

## ⚠️ FIREBASE_SERVICE_ACCOUNT — the double-encoding trap

`dashboard_admin/.env.local` stores `FIREBASE_SERVICE_ACCOUNT` as an **escaped JSON string** (outer quotes, `\"`, literal `\n`). Uploading that raw to Vercel makes Firebase Admin fail → **"Login master indisponível"** / Admin SDK won't init. Upload a **clean, single-line JSON** instead:

```bash
cd dashboard_admin
node -e '
const fs=require("fs");
function esc(v){let f="",i=false,e=false;for(const c of v){if(e){f+=c;e=false;}else if(c==="\\"&&i){f+=c;e=true;}else if(c==="\""){i=!i;f+=c;}else if(c==="\n"&&i){f+="\\n";}else{f+=c;}}return f;}
let v=fs.readFileSync(".env.local","utf8").split(/\r?\n/).find(l=>l.startsWith("FIREBASE_SERVICE_ACCOUNT=")).slice(25).trim();
const at=[()=>JSON.parse(v),()=>{const s=JSON.parse(v);return typeof s==="string"?JSON.parse(esc(s)):s;},()=>{let c=v;if(v.includes("\\\""))c=v.replace(/\\\"/g,"\"");return JSON.parse(esc(c));}];
for(const a of at){try{const p=a();if(p&&p.private_key){p.private_key=p.private_key.replace(/\\n/g,"\n");fs.writeFileSync("/tmp/sa_clean.json",JSON.stringify(p));console.log("OK");break;}}catch{}}
'
npx -y vercel@latest env rm FIREBASE_SERVICE_ACCOUNT production --yes
cat /tmp/sa_clean.json | npx -y vercel@latest env add FIREBASE_SERVICE_ACCOUNT production
rm -f /tmp/sa_clean.json
npx -y vercel@latest deploy --prod --yes
```
**Correct sign:** `vercel env add` must NOT warn "Value includes surrounding quotes". If it does, the outer quotes weren't stripped — redo.

## Gotchas

- **Node 20 always** (`nvm use 20`) — Node 18 breaks the Vercel CLI.
- **No GitHub auto-deploy** — you must run `vercel deploy --prod` to ship dashboard changes.
- Run deploy/env commands from `dashboard_admin/` (the linked dir), not the repo root.
- The dashboard writes the catalog via Admin SDK API routes (`/api/catalog`, `/api/catalog/services`) which need `FIREBASE_SERVICE_ACCOUNT` — if catalog saves fail, check that var first. The backend that reads it lives on Render → see [aquiresolve-render](../aquiresolve-render/SKILL.md); seeding/rules → [aquiresolve-firebase](../aquiresolve-firebase/SKILL.md).
