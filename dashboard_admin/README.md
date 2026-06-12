# Painel Admin — AquiResolve

Painel administrativo do marketplace AquiResolve. Desenvolvido em Next.js 15 com Firebase Admin SDK.

---

## Setup

### 1. Instalar dependências
```bash
npm install
# ou
pnpm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.local.example .env.local
# Editar .env.local com os valores reais (ver seção abaixo)
```

### 3. Rodar em desenvolvimento
```bash
npm run dev
# Acessa http://localhost:3000
```

### 4. Criar usuário admin no Firebase
O painel usa Firebase Authentication. Crie o usuário admin no [Firebase Console](https://console.firebase.google.com/project/aplicativoservico-143c2/authentication/users) ou via Admin SDK:
```js
await admin.auth().createUser({ email: 'master@aquiresolve.com', password: 'SenhaSegura123!' })
```

### 5. Inicializar dados do AdminMaster
Após criar o usuário no Firebase Auth, inicialize o documento `adminmaster/master` no Firestore:
```bash
curl -X POST http://localhost:3000/api/setup-adminmaster \
  -H "Content-Type: application/json" \
  -d '{"email":"master@aquiresolve.com","nome":"Admin Master"}'
```

---

## Variáveis de Ambiente (`.env.local`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Sim | Chave API Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Sim | Domínio de auth Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Sim | ID do projeto Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Sim | Bucket do Storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sim | Sender ID FCM |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Sim | App ID Firebase |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Não | ID Analytics |
| `FIREBASE_SERVICE_ACCOUNT` | Sim | JSON da service account (servidor only) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Não | Chave Google Maps |
| `API_KEY_PRIVATE_PAGARME` | Não | Chave secreta Pagar.me |
| `API_KEY_PUBLIC_PAGARME` | Não | Chave pública Pagar.me |

**Importante:** O `FIREBASE_SERVICE_ACCOUNT` deve ser o conteúdo completo do JSON da service account em uma única linha. Nunca expor ao browser — usar apenas em variáveis sem prefixo `NEXT_PUBLIC_`.

---

## Arquitetura

```
dashboard_admin/
├── app/                   # Páginas Next.js (App Router)
│   ├── api/               # API Routes (backend real do painel)
│   ├── dashboard/         # Página principal do dashboard
│   ├── users/             # Gestão de usuários
│   ├── orders/            # Gestão de pedidos
│   ├── financial/         # Relatórios financeiros
│   └── ...
├── components/            # Componentes React reutilizáveis
├── hooks/                 # Hooks React customizados
├── lib/                   # Utilitários e serviços
│   ├── firebase.ts        # Firebase Client SDK
│   ├── firebase-admin.ts  # Firebase Admin SDK (server only)
│   ├── firestore.ts       # Helpers para Firestore
│   └── services/          # Serviços de dados
└── src/                   # Servidor Express auxiliar (opcional)
    ├── server.ts
    ├── controllers/
    ├── services/
    └── routes/
```

### Backend: Next.js API Routes vs Express

O **backend principal** é formado pelas **API Routes do Next.js** em `app/api/`. Elas usam o Firebase Admin SDK e são o que o frontend chama.

O **servidor Express** em `src/` é auxiliar e opcional. Para rodá-lo:
```bash
npm run dev:full    # Next.js + Express juntos
```
O Express não é chamado pelo frontend diretamente — use apenas para integrações externas futuras.

---

## Autenticação

O painel usa **Firebase Auth** com email/senha. O fluxo é:

1. Usuário faz login em `GET /` (página de login)
2. `auth-provider.tsx` chama `signInWithEmailAndPassword(auth, email, password)`
3. Firebase Auth retorna um token JWT
4. O token é usado pelo client SDK para leituras diretas do Firestore
5. As API Routes no servidor verificam o token via Firebase Admin SDK quando necessário

**Coleção `adminmaster/master`:** Contém dados do admin (email, hash de senha, permissões). Só pode ser acessada via Firebase Admin SDK (servidor). As regras do Firestore bloqueiam qualquer acesso via client SDK.

---

## Deploy (Vercel)

O projeto está conectado ao Vercel. Push no branch `master` do GitHub dispara deploy automático.

**Variáveis de ambiente no Vercel:** Configurar em Settings > Environment Variables com os mesmos valores do `.env.local`.

```bash
npm run build   # Build de produção (usado pelo Vercel)
```

---

## Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | Desenvolvimento Next.js (porta 3000) |
| `npm run dev:server` | Desenvolvimento Express (porta 3001) |
| `npm run dev:full` | Next.js + Express juntos |
| `npm run build` | Build de produção |
| `npm run start` | Servir build de produção |
| `npm run lint` | Linting |
