---
name: aquiresolve-render
description: Manage the AquiResolve payments backend on Render.com — list/update environment variables and trigger deploys via the Render REST API. Use whenever you need to deploy the Node/Express backend (backend/), change its env vars, check deploy status, or read its logs. The backend has autoDeploy OFF, so pushing to GitHub does NOT redeploy it — you must trigger deploys here.
---

# AquiResolve — Render (payments backend)

The backend (`backend/`, Node/Express) is deployed as Render web service **AquiResolve**.

- **Service ID:** `srv-d6hmk2p4tr6s73bu5fm0`
- **Public URL:** https://aquiresolve.onrender.com
- **Repo/branch:** `github.com/alvaro209890/AquiResolve` @ `main`
- **autoDeploy: OFF** → a `git push` to `main` does **not** redeploy. You must trigger a deploy via the API after pushing backend changes.

## Credentials (never commit, never paste into chat)

The Render API key is in **`.render-credentials`** at the repo root (gitignored) and in the `render-credentials` memory. Load it into a shell var — do not echo it:

```bash
RKEY=$(grep '^RENDER_API_KEY=' /home/acer/Documentos/app/.render-credentials | cut -d= -f2)
SRV=srv-d6hmk2p4tr6s73bu5fm0
```

All calls: `curl -H "Authorization: Bearer $RKEY" https://api.render.com/v1/...`

## List env vars (keys only — don't print secret values)

```bash
curl -s -H "Authorization: Bearer $RKEY" "https://api.render.com/v1/services/$SRV/env-vars" \
  | python3 -c "import sys,json;[print(' -',e['envVar']['key']) for e in json.load(sys.stdin)]"
```

Required keys (verified present 2026-06-13): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (the backend reads `catalog_services` from Firestore — these three are mandatory), `PAGARME_SECRET_KEY` (sk_ LIVE), `PAGARME_BASE_URL`, `CORS_ORIGIN`, `NODE_ENV=production`, `KEEP_ALIVE_ENABLED/URL/INTERVAL_MS`, `CRON_SECRET`. The exact vars the code reads are in `backend/src/config/env.js`.

Format rules:
- `FIREBASE_PRIVATE_KEY` = full PEM. `env.js` does `replace(/\\n/g,'\n')`, so either literal `\n` or real newlines work, but it **must** begin `-----BEGIN PRIVATE KEY-----` and not start with `{`.
- `FIREBASE_PROJECT_ID` must be exactly `aplicativoservico-143c2`.

## Update / add env vars

Single var (PUT is upsert):
```bash
curl -s -X PUT -H "Authorization: Bearer $RKEY" -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/$SRV/env-vars/SOME_KEY" -d '{"value":"the-value"}'
```
Bulk replace (PUT the whole array — include ALL vars or you wipe the rest):
```bash
curl -s -X PUT -H "Authorization: Bearer $RKEY" -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/$SRV/env-vars" \
  -d '[{"key":"K1","value":"v1"},{"key":"K2","value":"v2"}]'
```
Updating env vars triggers a deploy automatically.

## Trigger a deploy (after pushing backend changes to main)

```bash
DEP=$(curl -s -X POST -H "Authorization: Bearer $RKEY" -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/$SRV/deploys" -d '{"clearCache":"do_not_clear"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
echo "deploy: $DEP"
```

Poll until terminal (`live` = success; `build_failed`/`update_failed`/`canceled` = failure):
```bash
i=0; until [ $i -ge 40 ]; do
  st=$(curl -s -H "Authorization: Bearer $RKEY" "https://api.render.com/v1/services/$SRV/deploys/$DEP" \
    | python3 -c "import sys,json;print(json.load(sys.stdin).get('status',''))")
  echo "$st"; case "$st" in live) break;; build_failed|update_failed|canceled|deactivated) break;; esac
  i=$((i+1)); sleep 15
done
```
Builds take ~1–3 min: `build_in_progress` → `update_in_progress` → `live`.

## Smoke test after deploy

```bash
curl -s https://aquiresolve.onrender.com/api/health    # {"ok":true,...}
```
The pricing endpoint `POST /api/payments/pricing/calculate` **requires a Firebase Authorization header** (returns `UNAUTHORIZED` without it) — that's correct security; test pricing from the app, not curl. Code path: `controllers/pricing.controller.js` → `services/service-pricing.service.js` (`calculateServicePricing` reads `catalog_services` first, cache 60s, falls back to the hardcoded table — never throws).

## Gotchas

- **autoDeploy is OFF** — always trigger a deploy explicitly after pushing backend code.
- First request after idle is slow (cold start); keep-alive mitigates but the very first hit may lag.
- Don't print secret env values; list keys only.
- See [aquiresolve-firebase](../aquiresolve-firebase/SKILL.md) for seeding `catalog_services` (the data this backend reads) and [aquiresolve-vercel](../aquiresolve-vercel/SKILL.md) for the dashboard that writes it.
