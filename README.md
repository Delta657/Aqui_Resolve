# AquiResolve — Marketplace de Serviços

Plataforma que conecta clientes a prestadores de serviços domésticos e profissionais. Composta por app Android, painel administrativo web e backend de pagamentos.

---

## Estrutura do Repositório

```
AquiResolve/
├── app/                    # App Android (Kotlin)
├── dashboard_admin/        # Painel Admin (Next.js 15)
├── backend/                # Backend de Pagamentos (Node.js + Pagar.me)
├── web/                    # Páginas web estáticas
├── docs/                   # Documentação técnica detalhada
├── firestore.rules         # Regras de segurança do Firestore
├── storage.rules           # Regras de segurança do Storage
├── firestore.indexes.json  # Índices compostos do Firestore
└── CLAUDE.md               # Guia completo para agentes de IA
```

---

## Início Rápido

### Pré-requisitos
- Node.js 20+ / pnpm
- Android Studio (para o app mobile)
- Firebase CLI: `npm install -g firebase-tools`
- Conta no Firebase, Pagar.me e (opcional) Vercel + Render

### 1. Clone e configure o Firebase
```bash
git clone git@github.com:alvaro209890/AquiResolve.git
cd AquiResolve
firebase login
firebase use aplicativoservico-143c2
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

### 2. Painel Admin
```bash
cd dashboard_admin
cp .env.local.example .env.local   # preencher com os valores reais
npm install
npm run dev
# Acesse http://localhost:3000
```

### 3. Backend de Pagamentos
```bash
cd backend
cp .env.example .env               # preencher com chaves Pagar.me e Firebase
npm install
npm start
```

### 4. App Android
- Abra a pasta `app/` no Android Studio
- Adicione `app/google-services.json` (baixar do Firebase Console)
- Execute no emulador ou dispositivo físico

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| App Mobile | Kotlin, Firebase SDK, Retrofit, Material Design 3 |
| Painel Admin | Next.js 15, React 19, TypeScript, Tailwind CSS, Firebase Admin SDK |
| Backend Pagamentos | Node.js 20, Express, Firebase Admin SDK, Pagar.me v5 |
| Banco de Dados | Firebase Firestore |
| Autenticação | Firebase Authentication |
| Armazenamento | Firebase Storage |
| Pagamentos | Pagar.me v5 (cartão de crédito + PIX) |

---

## Firebase Project

**Project ID:** `aplicativoservico-143c2`

Coleções principais:
- `users` — clientes e prestadores
- `providers` — perfil detalhado dos prestadores
- `orders` — pedidos de serviço
- `checklists` — ordens de serviço (OS)
- `chatRooms` — mensagens em tempo real
- `app_config/cashback` — configurações do programa AquiCash

---

## Documentação Técnica

Consulte a pasta `docs/` para documentação detalhada de cada subsistema:

- `SISTEMA_CASHBACK_AQUICASH.md` — Programa de fidelidade AquiCash
- `SISTEMA_PAGAMENTO_PAGARME.md` — Fluxo de pagamentos
- `SISTEMA_CHECKLIST_OS.md` — Ordem de Serviço digital
- `CHECKLIST_PRESTADOR_FIREBASE_RENDER.md` — Contrato do checklist mobile, exibição no admin, Firebase e relação com Render
- `FIREBASE_SETUP_GUIDE.md` — Configuração do Firebase
- `SISTEMA_LOCALIZACAO_PRESTADORES.md` — Rastreamento em tempo real
- `TABELA_PRECOS_SERVICOS.md` — Tabela de preços

**Para agentes de IA:** leia o `CLAUDE.md` na raiz — contém toda a arquitetura, decisões de design e fluxos de trabalho.

---

## Variáveis de Ambiente

**Painel Admin** (nunca vão ao GitHub):
- `dashboard_admin/.env.local` — credenciais Firebase + Pagar.me (ver `.env.local.example`)

**Backend** (nunca vai ao GitHub):
- `backend/.env` — credenciais Firebase + chave secreta Pagar.me (ver `.env.example`)

**App Mobile** (nunca vai ao GitHub):
- `app/google-services.json` — configuração Firebase do Android

---

## Deploy

| Componente | Plataforma | Trigger |
|---|---|---|
| Painel Admin | Vercel | Push no `master` |
| Backend Pagamentos | Render.com | Manual ou webhook |
| App Mobile | Google Play | Manual via Android Studio |

---

## Licença

Projeto privado — todos os direitos reservados.
