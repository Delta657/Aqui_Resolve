# Arquitetura Técnica — AquiResolve

## Fluxo de dados resumido

```
[App Android]
    │  Firebase SDK (Firestore, Auth, Storage, FCM)
    │  Retrofit → backend para pagamento
    ▼
[Firebase]
    │  Admin SDK (bypass das regras)
    ▼
[Painel Admin Next.js]   →   Vercel
    │
    └── API Routes (app/api/) usam Firebase Admin SDK
        NÃO chamam o backend de pagamentos

[Backend Node.js]   →   Render.com :aquiresolve.onrender.com
    │  Pagar.me v5 API
    │  Firebase Admin SDK (verifica token do app)
    └── endpoints: /api/payments/card, /api/payments/pix, /api/payments/pricing/calculate
```

---

## Firebase

**Projeto:** `aplicativoservico-143c2`

### Coleções Firestore

| Coleção | Quem escreve | Quem lê |
|---|---|---|
| `users/{uid}` | App (client SDK) + Painel (Admin SDK) | Todos autenticados |
| `users/{uid}/cashback_transactions` | Painel Admin SDK APENAS | Dono |
| `providers/{uid}` | App + Painel Admin SDK | Todos autenticados |
| `orders/{id}` | App (create), App (update limitado), Painel Admin SDK | Todos autenticados |
| `checklists/{orderId}` | App (create+update) | Todos autenticados |
| `notifications/{id}` | Painel Admin SDK APENAS | Dono (read+update) |
| `userTokens/{uid}` | App | Dono |
| `adminLogs/{id}` | Painel Admin SDK APENAS | Ninguém via client |
| `app_config/cashback` | Painel Admin SDK APENAS | Todos autenticados |
| `adminmaster/master` | Admin SDK APENAS | Ninguém via client |
| `provider_verifications/{id}` | Admin SDK APENAS | Todos autenticados |
| `cashback_transactions` | Admin SDK APENAS | Dono |
| `chatRooms/{id}` | App | Participantes |

### Regras críticas
- `adminmaster` → `allow read, write: if false` (Admin SDK bypassa)
- `cashback_transactions` → `allow write: if false` (não pode se auto-creditar)
- `notifications` → `allow create: if false` (só server cria)
- `adminLogs` → `allow read, write: if false`

### Custom Claims necessários para admin
```js
admin.auth().setCustomUserClaims(uid, { role: 'admin' })
// ou
admin.auth().setCustomUserClaims(uid, { admin: true })
```

---

## App Android

### Estrutura de packages

```
com.aquiresolve.app/
├── adapters/          RecyclerView adapters
├── api/               Retrofit interfaces (PagarMeApiService)
├── constants/         Constantes de resultado de pagamento
├── models/            Data classes (OrderData, OsChecklistData, etc.)
├── models/payment/    Models específicos de pagamento
├── payment/           PagarMeManager (lógica de pagamento)
├── utils/             Helpers (NotificationBadgeHelper, VerificationCodeGenerator, etc.)
├── views/             Views customizadas (SignaturePad)
├── Firebase*Manager   Managers de dados (um por domínio)
└── *Activity          Telas
```

### Activities principais e o que fazem

| Activity | Papel |
|---|---|
| `MainActivity` | Splash/roteamento por role (cliente vs prestador) |
| `ClientHomeActivity` | Home do cliente (cashback card, pedidos recentes) |
| `ProviderHomeActivity` | Home do prestador (saldo, banner de verificação) |
| `ServicesActivity` | Catálogo de serviços para o cliente |
| `CreateOrderActivity` | Criação do pedido |
| `PaymentActivity` | Seleção de método de pagamento |
| `PixPaymentActivity` | QR PIX + polling de status |
| `ChecklistActivity` | Checklist da OS (prestador preenche) |
| `PhotoEvidenceActivity` | Fotos antes/durante/depois |
| `DigitalSignatureActivity` | Assinaturas digitais |
| `NotificationHistoryActivity` | Histórico de notificações do Firestore |
| `CashbackActivity` | Extrato de cashback |
| `ProviderFinancialActivity` | Saldo e ganhos do prestador |
| `ProviderVerificationStatusActivity` | Status da verificação do prestador |

### Modelo OsChecklistData (campos completos)

```kotlin
// GPS
startLatitude, startLongitude, startedAt

// Step 1 — Chegada
clientPresent, serviceMatches, visibleDamage, materialAvailable, clientObservations

// NOVO: avarias pré-existentes (texto livre)
preExistingDamages: String

// Step 2 — Execução
executedAsRequested, additionalService, partsReplaced, valueChanged,
serviceCompleted, cleanAfterService

// NOVO: resolução do problema
problemResolution: String  // "resolved" | "return_needed" | "not_resolved"

// NOVO: declaração de concordância
declarationAccepted: Boolean?

// Descrição e fotos
executionDescription: String
photosBefore, photosDuring, photosAfter: List<String>
photoTimestampsBefore/During/After: List<Timestamp>

// Assinaturas
providerSignatureUrl, providerSignatureName, providerSignedAt
clientSignatureUrl, clientSignatureName, clientSignatureDocument, clientSignedAt

// Metadados
completedAt, createdAt, updatedAt, status
```

### Fluxo de status do pedido

```
awaiting_payment  →  pending  →  distributing  →  assigned  →  in_progress  →  completed
                                                                             └→  cancelled
```

- `awaiting_payment`: criado, aguardando pagamento
- `pending`: pago, aguardando ser distribuído
- `distributing`: sendo enviado para prestadores
- `assigned`: prestador aceitou
- `in_progress`: prestador marcou início (GPS registrado)
- `completed`: ambos confirmaram conclusão
- `cancelled`: cancelado por cliente/prestador/admin

---

## Painel Admin (Next.js 15)

### Estrutura de rotas

```
/dashboard/
├── page.tsx                           KPIs e resumo
├── servicos/
│   ├── visualizar/page.tsx            Lista de pedidos (filtro, paginação, export CSV)
│   └── os/[orderId]/page.tsx          Detalhe da OS (checklist completo)
├── controle/
│   ├── aceitacao-prestadores/         Verificar prestadores
│   ├── notificacoes/                  Enviar FCM push
│   ├── logs/                          Logs de auditoria
│   └── autem-mobile/rastreamento/     Mapa ao vivo
├── financeiro/
│   └── relatorios/                    Relatórios financeiros
└── configuracoes/
    └── aquicash/                      Config programa cashback
```

### Variáveis de ambiente necessárias (.env.local)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aplicativoservico-143c2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  # JSON em 1 linha
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
API_KEY_PRIVATE_PAGARME=sk_...
```

### API Routes críticas

| Rota | O que faz |
|---|---|
| `PATCH /api/orders/[id]` | Atualiza status, credita cashback ao completar, envia push |
| `POST /api/providers/[id]/verify` | Aprova/rejeita prestador (Admin SDK) |
| `PATCH /api/users/[id]` | Bloqueia/desbloqueia usuário |
| `POST /api/notifications/send` | Envia FCM push + persiste no Firestore |
| `GET /api/providers/active` | Lista prestadores aprovados para redirecionamento |
| `POST /api/orders/[id]/redirect` | Redireciona pedido para prestador ou pool |

---

## Backend (Node.js/Render)

### Endpoints

```
GET  /api/health
POST /api/payments/card
POST /api/payments/pix
POST /api/payments/pricing/calculate
GET  /api/payments/{orderId}/status
```

### Variáveis de ambiente no Render

```
NODE_ENV=production
PORT=10000
PAGARME_BASE_URL=https://api.pagar.me/core/v5
PAGARME_SECRET_KEY=sk_...
FIREBASE_PROJECT_ID=aplicativoservico-143c2
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@aplicativoservico-143c2.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMII...-----END PRIVATE KEY-----\n
CORS_ORIGIN=*
KEEP_ALIVE_ENABLED=true
KEEP_ALIVE_URL=https://aquiresolve.onrender.com/api/health
KEEP_ALIVE_INTERVAL_MS=840000
```

**ATENÇÃO:** `FIREBASE_PRIVATE_KEY` deve conter `\n` literal (não quebras de linha reais).  
O `env.js` faz `replace(/\\n/g, '\n')` automaticamente.

---

## Arquivos NÃO versionados (nunca commitar)

- `dashboard_admin/.env.local`
- `app/google-services.json`
- `app/keystore/`
- `backend/.env`
- `app/.render-credentials` (se existir)
