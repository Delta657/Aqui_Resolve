---
name: aquiresolve-firebase
description: Deploy and manage Firebase for the AquiResolve project — publish Firestore rules/indexes, seed the service catalog (service_categories + catalog_services), and run Admin SDK scripts. Use whenever you need to push firestore.rules, deploy indexes, seed/migrate catalog data, or run any script that talks to Firestore project aplicativoservico-143c2.
---

# AquiResolve — Firebase

Firebase project: **`aplicativoservico-143c2`**. The Firebase CLI is **not** installed globally — always use `npx -y firebase-tools@latest`. There is no interactive login here; authenticate non-interactively with the **service account** below.

## Credentials (never commit, never paste into chat)

The Admin SDK service account lives **double-encoded** in `dashboard_admin/.env.local` under `FIREBASE_SERVICE_ACCOUNT` (gitignored). The outer value is a JSON string containing JSON, with `\"` and literal newlines — you must decode it before use. Reuse the proven extractor below (same logic as `dashboard_admin/lib/firebase-admin.ts` and `scripts/seed-catalog.mjs`).

```bash
cd dashboard_admin
node -e '
const fs=require("fs");
function esc(v){let f="",i=false,e=false;for(const c of v){if(e){f+=c;e=false;}else if(c==="\\"&&i){f+=c;e=true;}else if(c==="\""){i=!i;f+=c;}else if(c==="\n"&&i){f+="\\n";}else{f+=c;}}return f;}
const raw=fs.readFileSync(".env.local","utf8");
let v=raw.split(/\r?\n/).find(l=>l.startsWith("FIREBASE_SERVICE_ACCOUNT=")).slice("FIREBASE_SERVICE_ACCOUNT=".length).trim();
const at=[()=>JSON.parse(v),()=>{const s=JSON.parse(v);return typeof s==="string"?JSON.parse(esc(s)):s;},()=>{let c=v;if(v.includes("\\\""))c=v.replace(/\\\"/g,"\"");return JSON.parse(esc(c));}];
for(const a of at){try{const p=a();if(p&&p.private_key){p.private_key=p.private_key.replace(/\\n/g,"\n");fs.writeFileSync("/tmp/sa_fb.json",JSON.stringify(p));console.log("OK",p.client_email,p.project_id);break;}}catch{}}
'
```

This writes a clean `/tmp/sa_fb.json`. **Always `rm -f /tmp/sa_fb.json` when done** (it holds the private key).

## Deploy Firestore rules

The rules file is `firestore.rules` at the **repo root** (not under `dashboard_admin/`, even though a copy of `firebase.json` exists there). Deploy with the service account:

```bash
cd /home/acer/Documentos/app
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; nvm use 20 >/dev/null 2>&1
export GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa_fb.json
npx -y firebase-tools@latest deploy --only firestore:rules --project aplicativoservico-143c2 --non-interactive
rm -f /tmp/sa_fb.json
```

Expected: `✔ cloud.firestore: rules file firestore.rules compiled successfully` then `released rules`. Compile **warnings** about unused functions (`isClient`, `isProviderOrAdmin`) and "Invalid variable name: request" are **pre-existing and harmless** — only treat `error` as failure.

- Rules + indexes together: `--only firestore:rules,firestore:indexes`.
- Indexes file: `firestore.indexes.json` (root). The dynamic catalog needs **no composite index** (app/backend filter `active` and sort `displayOrder` in code), so normally deploy rules only.
- Storage rules: `--only storage` (file `storage.rules`).

## Security model (must preserve)

These collections are **read if signed-in, write `if false`** — writable **only via Admin SDK** (dashboard API routes), never client SDK:
`adminmaster/**`, `app_config/**`, `service_categories`, `service_types`, `service_providers`, **`catalog_services`**.
If you add a catalog-like collection, follow the same pattern in `firestore.rules`.

## Seed / migrate catalog data (Admin SDK scripts)

Run from `dashboard_admin/` (it has `firebase-admin` + `.env.local`). Scripts are **idempotent** (deterministic doc ids, `merge: true`).

```bash
cd dashboard_admin
node scripts/seed-catalog.mjs            # 14 NICHOS → service_categories + service_types
node scripts/seed-catalog-services.mjs   # 87 SERVIÇOS (nicho+valor+%) → catalog_services
```

`seed-catalog-services.mjs` migrates the canonical price table from `backend/src/services/service-pricing.service.js`, derives `providerCommissionPercent` and recomputes `providerCommission` (R$). Keep its `PRICING` object in sync if the backend table changes. Niche-name reconciliation: table `"Desentupimento com maquinário"` → catalog `"Desentupimento com maquinário até 2 m"` (the name the app sends).

## Writing a new Admin SDK script

Model on `scripts/seed-catalog-services.mjs`: it has a self-contained `loadServiceAccount()` that parses the double-encoded `.env.local` value — copy that helper rather than reinventing it. Always `process.exit(0/1)` and log created/updated counts.

## Gotchas

- **Node ≥ 20** for `firebase-tools` and most `.mjs` scripts (`nvm use 20`). The PC default node is 18.
- Never echo `FIREBASE_SERVICE_ACCOUNT`, `/tmp/sa_fb.json`, or `private_key` into chat or commits.
- The web API key (`NEXT_PUBLIC_FIREBASE_API_KEY`) is referrer-restricted — you can't mint ID tokens for the Auth REST API from a server/CLI. To test authenticated backend endpoints, do it from the app, not curl.
- Field-name compatibility is load-bearing: `catalog_services.niche` must equal the category the app sends, and `.name` the serviceType. See [aquiresolve-render](../aquiresolve-render/SKILL.md) for how the backend consumes it.
