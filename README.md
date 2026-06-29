<div align="center">

# 🛠️ AquiResolve

**Marketplace de serviços domésticos e profissionais** — conecta clientes a prestadores, do pedido ao pagamento, com rastreamento ao vivo, chat, ordem de serviço digital, cashback e uma assistente de IA (a **Helô**).

`App Android (Kotlin)` · `Painel Admin (Next.js 15)` · `Backend de Pagamentos (Node.js + Pagar.me)` · `Firebase`

</div>

---

## 📑 Sumário

- [Visão geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Componentes](#-componentes)
- [Funcionalidades](#-funcionalidades)
- [Ciclo de vida do pedido](#-ciclo-de-vida-do-pedido)
- [Modelo de dados (Firestore)](#-modelo-de-dados-firestore)
- [Segurança](#-segurança)
- [Inteligência Artificial (Helô + Copiloto)](#-inteligência-artificial-helô--copiloto)
- [Início rápido](#-início-rápido)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Deploy](#-deploy)
- [Documentação](#-documentação)
- [Convenções de Git](#-convenções-de-git)
- [Status e bloqueadores conhecidos](#-status-e-bloqueadores-conhecidos)

---

## 🌎 Visão geral

O cliente descreve (ou **fotografa**) um problema, a plataforma encontra o serviço e o
preço certos, distribui o pedido para os prestadores do nicho, acompanha o
atendimento em tempo real e processa o pagamento. O prestador recebe alertas sonoros
de novos pedidos (mesmo com o app fechado), executa a **Ordem de Serviço** com
checklist e fotos, e finaliza com um código de confirmação do cliente.

| | |
|---|---|
| **Domínio** | Serviços domésticos/profissionais (elétrica, hidráulica, faxina, guincho, etc.) |
| **Firebase Project** | `aplicativoservico-143c2` |
| **Pagamentos** | Pagar.me v5 (cartão de crédito + PIX) |
| **Idioma** | Português do Brasil |
| **Licença** | Privada — todos os direitos reservados |

---

## 🏗 Arquitetura

```
                         ┌──────────────────────────┐
   ┌──Retrofit──────────▶│  Backend de Pagamentos   │──Pagar.me v5──▶ 💳 Pagar.me
   │                     │  (Node.js / Express)     │
   │                     └────────────┬─────────────┘
   │                                  │ Firebase Admin SDK
┌──┴───────────┐                      ▼
│ App Android  │──Firebase SDK──▶ ┌───────────────────────────┐
│  (Kotlin)    │                  │  Firestore / Auth / Storage│
└──────────────┘                  └─────────────┬──────────────┘
                                                 │ Firebase Admin SDK
                                  ┌──────────────┴──────────────┐
                                  │  Painel Admin (Next.js 15)  │
                                  └─────────────────────────────┘
```

**Regra de ouro:** o Painel Admin **nunca** chama o backend de pagamentos
diretamente. Toda escrita crítica (status de pedido, cashback, reembolso) passa pelo
**Firebase Admin SDK** nas API Routes do Next.js, que ignoram as regras do Firestore.

---

## 🧩 Componentes

| Componente | Pasta | Stack | Deploy |
|---|---|---|---|
| **App Mobile** | [`app/`](app/) | Kotlin 1.9 · SDK 24–35 · Firebase BOM 32.7 · Retrofit · Glide · OSMDroid · Material 3 | Google Play |
| **Painel Admin** | [`dashboard_admin/`](dashboard_admin/) | Next.js 15 · React 19 · TS · Tailwind 4 · Radix · TanStack · Firebase Admin | Vercel |
| **Backend Pagamentos** | [`backend/`](backend/) | Node.js 20 · Express 4 · Firebase Admin · Axios · Pagar.me v5 | Render.com |
| **Páginas web** | [`web/`](web/) | HTML/CSS estático | — |

### Comandos essenciais

```bash
# App Android
./gradlew assembleDebug        # APK debug (~17 MB)   ./gradlew testDebugUnitTest
./gradlew bundleRelease        # AAB para a Play Store

# Painel Admin (em dashboard_admin/)
npm install && npm run dev      # http://localhost:3000      npm run build

# Backend (em backend/)
npm install && npm start        # porta 3000      node --test test/
```

---

## ✨ Funcionalidades

### Cliente (app)
- **Home Premium**: busca inteligente, banner rotativo, categorias, cashback, combos, parceiros, pedidos recentes.
- **Criação de pedido** com endereço, fotos e agendamento; **catálogo dinâmico** de nichos e serviços (vindo do Firestore).
- **Pagamento** cartão de crédito e PIX (Pagar.me) com aplicação de cashback/desconto no carrinho.
- **Acompanhamento ao vivo** (mini-mapa da rota do prestador) e **chat** com o prestador.
- **Ordem de Serviço**: confirma a conclusão com **código de verificação**.
- **Avaliação bidirecional** (cliente ↔ prestador) e **cashback (AquiCash)**.
- **Helô (IA)**: descreve por texto/voz **ou envia uma foto** do problema e recebe o serviço sugerido.
- **Central AquiResolve**: chat do cliente com o suporte.

### Prestador (app)
- **Alerta sonoro contínuo** de novos pedidos do seu nicho — toca **mesmo com o app fechado**, para quando alguém aceita; a recusa é **por‑prestador**.
- Aceitar / recusar pedidos; **cards de pedidos** na home; disponibilidade on/off.
- **OS digital**: checklist, fotos antes/durante/depois, assinatura, GPS; finalização por código.
- **Financeiro** (saldo/ganhos), **status de verificação**, solicitação de nichos com documentos.
- **Central AquiResolve**: chat do prestador com o suporte.

### Painel Admin
- Gestão de **pedidos** (raio‑x, diagnóstico de travamento), **monitoramento em tempo real** com alerta de ociosidade.
- **Usuários/prestadores** (verificação, bloqueio, especialidades), **financeiro** (Recharts, pagamentos com comprovante), **reembolso** (Pagar.me).
- **Catálogo** (nichos e serviços com % do prestador), **cashback**, **banners**, **combos**, **parceiros**.
- **Chat** com clientes e com prestadores (+ broadcast), **notificações FCM**, **logs de auditoria**, **manual** com **Copiloto IA**.

---

## 🔄 Ciclo de vida do pedido

```
awaiting_payment ──(pagamento confirmado)──▶ distributing ──(prestador aceita)──▶ assigned
        │                                          │                                  │
        └──────────────────────────────────────────┴─────────▶ cancelled / expired    ▼
                                                                                  in_progress
                                                                                       │
                                                                                  completed
```

- O pedido nasce em `awaiting_payment` (payload enxuto — *pay‑before‑distribution*).
- O **backend** vira para `distributing` somente quando o pagamento confirma; aí dispara **FCM data‑only** para os prestadores disponíveis do nicho (som contínuo).
- Aceite → `assigned`; OS iniciada → `in_progress`; código do cliente → `completed`.

---

## 🗂 Modelo de dados (Firestore)

| Coleção | Conteúdo |
|---|---|
| `users/{uid}` | Perfil (cliente/prestador) · subcoleção `cashback_transactions` |
| `providers/{uid}` | Perfil do prestador (nichos, verificação, saldo, disponibilidade) |
| `orders/{id}` | Pedidos · `checklists/{orderId}` = Ordem de Serviço |
| `catalog_services` · `service_categories` | Catálogo de serviços e nichos (só leitura no app) |
| `app_config/cashback` | Configuração do AquiCash (só Admin SDK) |
| `client_chats` · `provider_chats` | Central ↔ cliente / prestador |
| `home_banners` · `home_combos` · `partners` | Vitrines da Home (só Admin SDK) |
| `fcm_tokens/{uid}` · `notifications` | Tokens de push e sino de notificações |
| `ai_chats/{id}` | Histórico das conversas com a Helô |

> Padrão: coleções de catálogo/config têm `read: isSignedIn()` e `write: false` — a
> escrita acontece exclusivamente via **Admin SDK** nas API Routes do painel.

---

## 🔐 Segurança

- **Firestore Rules** (`firestore.rules`) e **Storage Rules** (`storage.rules`) — autenticação por Firebase Auth; funções `isSignedIn()`, `isOwner()`, `isAdmin()`, `isProvider()`.
- **Cuidado clássico das regras:** acessar um campo ausente por notação de ponto **gera erro e nega** — use `.get('campo', null)`.
- **Escrita privilegiada** do painel passa por API Routes (Admin SDK), que ignoram as regras — por isso o admin não precisa de custom claim.
- Segredos (`.env*`, `google-services.json`, service accounts) **nunca** vão ao GitHub.

---

## 🤖 Inteligência Artificial (Helô + Copiloto)

| Recurso | Onde | Como |
|---|---|---|
| **Helô — chat** | App cliente | `POST /api/ai/chat` (SSE streaming), diagnostica e sugere o nicho |
| **Helô — voz** | App cliente | reconhecimento nativo pt‑BR, auto‑envio |
| **Helô — visão** 🆕 | App cliente | `POST /api/ai/vision` — envia **foto do problema** → modelo multimodal da Groq sugere o serviço |
| **Copiloto do Painel** | Painel admin | `POST /api/assistant` — responde "como faço X?" fundamentado no Manual |

Tudo usa a **Groq** via proxy no backend/servidor — a `GROQ_API_KEY` vive **só no
servidor**, nunca no APK. Modelos configuráveis por env (`GROQ_MODEL`,
`GROQ_VISION_MODEL`).

---

## 🚀 Início rápido

**Pré‑requisitos:** Node.js 20+, Android Studio, Firebase CLI, contas Firebase/Pagar.me (e Vercel/Render para deploy).

```bash
# 1) Clone + regras Firebase
git clone git@github.com:alvaro209890/AquiResolve.git && cd AquiResolve
firebase login && firebase use aplicativoservico-143c2
firebase deploy --only firestore:rules,firestore:indexes,storage:rules

# 2) Painel Admin
cd dashboard_admin && cp .env.local.example .env.local   # preencha
npm install && npm run dev                                # http://localhost:3000

# 3) Backend de Pagamentos
cd ../backend && cp .env.example .env                     # preencha
npm install && npm start

# 4) App Android — abra app/ no Android Studio, adicione app/google-services.json e rode
```

> Configuração inicial completa do admin master e Firebase em
> [`docs/FIREBASE_SETUP_GUIDE.md`](docs/FIREBASE_SETUP_GUIDE.md) e no
> [`CLAUDE.md`](CLAUDE.md).

---

## 🔑 Variáveis de ambiente

Nenhuma vai ao GitHub. Modelos em `*.example`.

| Componente | Arquivo | Principais |
|---|---|---|
| Painel Admin | `dashboard_admin/.env.local` | `FIREBASE_SERVICE_ACCOUNT`, `NEXT_PUBLIC_FIREBASE_*`, `*_PAGARME`, `GROQ_API_KEY`, Google Maps |
| Backend | `backend/.env` | `PAGARME_SECRET_KEY`, `FIREBASE_*`, `GROQ_API_KEY`, `GROQ_VISION_MODEL` |
| App | `app/google-services.json` | Configuração Firebase do Android |

---

## 📦 Deploy

> **Não há auto‑deploy a partir do GitHub.** Cada componente é publicado manualmente.

| Componente | Plataforma | Como |
|---|---|---|
| **Painel Admin** | Vercel (`alvaro209890s-projects`) | `cd dashboard_admin && npx vercel deploy --prod --yes` |
| **Backend** | Render (`srv-d6hmk2p4tr6s73bu5fm0`, autoDeploy **off**) | Deploy manual no painel **ou** `POST /v1/services/{id}/deploys` (API) |
| **Firebase** | Firestore/Storage rules + índices | `firebase deploy --only firestore:rules,...` (ou REST com service account) |
| **App** | Google Play | `./gradlew bundleRelease` (AAB assinado) · CI: workflow **Build APK** (artifacts) |

---

## 📚 Documentação

- **[`CLAUDE.md`](CLAUDE.md)** — guia mestre: arquitetura, decisões, todos os fluxos, troubleshooting. **Comece por aqui.**
- **[`docs/`](docs/)** — documentação técnica detalhada por subsistema e histórico de correções. Veja o índice em **[`docs/README.md`](docs/README.md)**.
- **[`novas-implementacoes/`](novas-implementacoes/)** — planos das funcionalidades (banners, combos, IA, Home Premium…).
- **Skills de infraestrutura** em `.claude/skills/` — operam Firebase, Render, Vercel, emulador e QA do painel com os comandos e *gotchas* já mapeados.

---

## 🌱 Convenções de Git

- Commitar **direto no `main`** (sem PR); o push **não** dispara deploy (publicação é manual).
- Dois remotes: **`origin`** (Delta657, HTTPS) e **`alvaro`** (SSH) — pushar nos dois.
- Mensagens claras e no infinitivo; documentar mudanças relevantes em `docs/`.

---

## 🚦 Status e bloqueadores conhecidos

- ✅ Núcleo sólido: pedido → distribuição → aceite → OS → finalização por código → avaliação; chats; reembolso; alerta sonoro (corrigido p/ Android 14+).
- ⚠️ **Pagamento Pagar.me**: PIX retorna `action_forbidden` (conta sem PIX habilitado) e o cartão precisa de teste real ponta a ponta — **principal bloqueador de lançamento** (configuração na conta Pagar.me, não código). Como o pedido só distribui após pagamento confirmado, isso também afeta o disparo do alerta de novo pedido.
- 🧹 Pontas de UI a finalizar/ocultar antes do lançamento (ex.: número de suporte do botão "Recorrer", itens "em desenvolvimento" do menu do pedido). Detalhes nas notas de correção em `docs/`.
