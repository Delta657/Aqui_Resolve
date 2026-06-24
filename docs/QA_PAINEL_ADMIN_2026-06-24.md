# QA do Painel Admin — 2026-06-24

Validação ponta a ponta do painel (`dashboard_admin/`, Next.js 15) num Google Chrome real,
logado como admin temporário com **todas** as 23 permissões. Procedimento e scripts reutilizáveis
em `.claude/skills/aquiresolve-painel-qa/` (+ `scripts/qa-temp-admin.mjs`, `scripts/qa-smoke.mjs`).

## Cobertura

- **Build de produção:** `npm run build` ✓ (117 páginas, 151 rotas; compila limpo). Obs.: o
  `next.config.mjs` tem `typescript.ignoreBuildErrors` e `eslint.ignoreDuringBuilds` ligados — o
  build **não** valida tipos/lint; a validação real foi por runtime no navegador.
- **Smoke-test das 25 páginas do sidebar** (a lista canônica é `components/layout/sidebar.tsx`; o
  resto de `app/` são páginas legadas/duplicadas não navegáveis): login + visita a cada rota,
  capturando erros de console, `pageerror`, respostas HTTP ≥400 e error boundaries.
- **Presença de dados** nas telas-chave: pedidos (7 linhas), clientes (66), prestadores (48),
  dashboard (38 KPIs) — todos renderizando dados reais, **zero erros de console**.

## Bugs encontrados e corrigidos

| # | Sintoma | Causa raiz | Correção |
|---|---------|-----------|----------|
| 1 | `GET /api/specialty-requests?status=pending` → **500** (quebra a fila de Especialidades) | `where('status','==',x)` + `orderBy('createdAt')` exige **índice composto**; sem ele a Admin SDK lança `FAILED_PRECONDITION` | Rota passou a **ordenar/limitar em memória** (padrão do projeto, sem índice). `app/api/specialty-requests/route.ts` |
| 2 | `GET /api/providers/[id]/verify` → **500** latente (histórico de verificação) | Mesma armadilha: `where('providerId')` + `orderBy('reviewedAt')` sem índice | Ordenação em memória. `app/api/providers/[id]/verify/route.ts` |

`adminLogs` (`orderBy('createdAt')` + filtros) foi verificado e **não** falha. Varredura feita com
`grep -rl "orderBy(" app/api` cruzando com `.where(`.

## Falsos positivos (não são bugs)

- `TypeError: Failed to fetch` em `adminFetch` nas páginas faturamento/reports/banners durante o
  smoke: **aborto de fetch por navegação rápida** (os hooks Pagar.me são lentos). Confirmado
  reabrindo cada página isolada com dwell de 8–16 s → **nenhum erro** durante o dwell; faturamento
  fez só `/api/auth/permissions` e `/api/financial/providers`, ambos **200**.
- 403/“Missing permissions” pontuais: artefatos de SSR/timing — as leituras client-SDK do painel
  passam porque `orders/users/providers` são `read: if isSignedIn()` e o admin está logado.

## Infra validada

- **Firebase rules:** já redeployadas hoje (corrigiram banners/combos/parceiros do app — ver
  `aquiresolve-banners-combos-rules-e-bottomnav`). Cobrem 42 coleções (app + painel). As correções
  deste QA **não** exigem índice novo (ordenação em memória).
- **Render (backend de pagamentos):** `GET /api/health` → **200**. Sem mudança de código no backend.
- **Vercel (painel):** redeploy de produção após as correções (ver histórico de deploy).
