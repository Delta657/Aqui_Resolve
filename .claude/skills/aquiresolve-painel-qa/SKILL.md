---
name: aquiresolve-painel-qa
description: Validar o painel admin (dashboard_admin/, Next.js) ponta a ponta num navegador real — subir o dev server, criar um admin temporário com TODAS as permissões, dirigir o Google Chrome do sistema com playwright-core e varrer todas as páginas do sidebar capturando erros de console/pageerror/HTTP. Use sempre que precisar testar o painel "como um usuário", caçar bugs de página/rota, ou checar uma funcionalidade antes de deploy. Cobre os gotchas (sandbox, NODE_PATH, token Bearer, índice composto).
---

# AquiResolve — QA do Painel Admin (navegador real)

Testa o painel `dashboard_admin/` (Next.js 15) num Chrome headless real, logado como admin.
O painel **não precisa de emulador** — roda no navegador normal (o `NEXT_PUBLIC_FIREBASE_API_KEY`
permite login Firebase de `localhost`). Use isto em vez de adivinhar se uma página funciona.

## 0. Pré-requisitos (gotchas que quebram tudo)

- **Node ≥ 20** (`nvm use 20`; o node padrão do PC é 18 e o Next exige ≥20.19).
- **Dev server precisa do sandbox DESLIGADO.** `next dev` morre com **exit 144 sem output** sob o
  sandbox do harness (mata o servidor persistente). Suba com `dangerouslyDisableSandbox: true` (é
  servidor local, baixo risco) **e** `run_in_background: true`.
- **`playwright-core` não está no `dashboard_admin/`.** Reuse um já instalado via `NODE_PATH`:
  `export NODE_PATH=/home/acer/simcar-auto/node_modules`. O Chrome do sistema é
  `/usr/bin/google-chrome` (use `executablePath` + `--no-sandbox`, `headless:true`).
- **NUNCA use `sleep` em foreground** (bloqueado → exit 144/1 e aborta o comando). Para esperar o
  dev server, use `curl --retry 40 --retry-delay 2 --retry-all-errors --retry-connrefused`.
- O Firebase Admin SDK vem do `.env.local` (double-encoded). Decodifique para `/tmp/sa_fb.json`
  com o extrator da skill [aquiresolve-firebase](../aquiresolve-firebase/SKILL.md) e **`rm -f` ao terminar**.

## 1. Subir o dev server

```bash
cd /home/acer/Documentos/Aqui_Resolve/dashboard_admin
nvm use 20
# rode em background COM sandbox desligado:
#   Bash tool: run_in_background=true, dangerouslyDisableSandbox=true
npx next dev -p 3000
# espere ficar pronto (sem sleep):
curl -s --retry 40 --retry-delay 2 --retry-all-errors --retry-connrefused -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

## 2. Admin temporário com TODAS as permissões

O painel resolve o ator em `GET /api/auth/permissions` (exige **Bearer ID token**) a partir de
`adminmaster/master/usuarios/{uid}` (`permissoes` + `ativo`). Para ver TODAS as páginas, crie um
Firebase Auth user + esse doc com todas as 23 chaves de `lib/admin-permissions.ts` em `true`
(não é "master" pois o e-mail difere do master; permissões todas-true bastam):

```bash
cd dashboard_admin
GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa_fb.json node scripts/qa-temp-admin.mjs create
# ...testes...
GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa_fb.json node scripts/qa-temp-admin.mjs remove   # SEMPRE remover depois (segurança)
```
Credenciais do QA admin: `qa.full.admin@aquiresolve.com` / `QaFull123456!`.
**Sempre remova o admin temporário ao final** (some o doc + desativa o user).

## 3. Smoke-test de todas as páginas do sidebar

A lista canônica de páginas reais está em `components/layout/sidebar.tsx` (o resto de `app/` tem
páginas legadas/duplicadas — `/services/*`, `/controle/*`, `/financial`, etc. — que **não** são
navegáveis). O script `scripts/qa-smoke.mjs` loga e visita cada rota do sidebar, capturando por
página: erros de console, `pageerror`, respostas HTTP ≥400 e error boundaries.

```bash
cd dashboard_admin
export NODE_PATH=/home/acer/simcar-auto/node_modules
node scripts/qa-smoke.mjs            # imprime "SMOKE REPORT" com ⚠️ por página
```

**Interpretando o relatório (gotcha):** `TypeError: Failed to fetch` em `adminFetch` que aparece
logo após visitar uma página "pesada" (faturamento/reports usam hooks Pagar.me lentos) é quase
sempre **aborto por navegação**, não bug. Confirme reabrindo a página **isolada** com dwell longo
(8–16 s, sem navegar): se não houver erro durante o dwell, era artefato. Bug real = erro **durante**
o dwell, status 500/403 consistente, ou error boundary visível.

## 4. Armadilha de índice composto (causa nº 1 de 500 nas rotas)

Rotas que fazem `query.where('campo','==',x).orderBy('outroCampo')` **exigem índice composto** no
Firestore; sem ele a Admin SDK lança `FAILED_PRECONDITION` → a rota responde **500**. O padrão do
projeto é **NÃO criar índice** e sim **ordenar/limitar em memória** (igual `provider-chats`):

```ts
let q = db.collection('x') as admin.firestore.Query
if (status !== 'all') q = q.where('status','==',status)
const snap = await q.get()
const rows = snap.docs.map(d=>({id:d.id,...d.data()}))
  .sort((a,b)=> toMillis(b.createdAt) - toMillis(a.createdAt)).slice(0,100)
```

Para varrer rotas com esse risco: `grep -rl "orderBy(" app/api --include=route.ts` e checar quais
também têm `.where(`. Reproduza a query exata via Admin SDK para confirmar antes de corrigir.
(Corrigido assim em 2026-06-24: `specialty-requests` e `providers/[id]/verify`.)

## 5. Limpeza

- `GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa_fb.json node scripts/qa-temp-admin.mjs remove`
- `rm -f /tmp/sa_fb.json`
- matar o dev server: `pkill -f "next dev"`

## Notas

- Login Firebase de `localhost` **funciona** (a API key permite localhost). Páginas de chat fazem
  polling (5–15 s) → use `waitUntil: 'domcontentloaded'`, nunca `networkidle`.
- Leituras client-SDK do painel (orders/users/providers) passam porque a regra é `read: isSignedIn()`
  e o admin está logado — não precisa de custom claim. Erros "Missing permissions" no log do dev
  server costumam ser artefato de SSR (capturados, não afetam o render).
- Scripts versionados: `dashboard_admin/scripts/qa-temp-admin.mjs` e `dashboard_admin/scripts/qa-smoke.mjs`.
