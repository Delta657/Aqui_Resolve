# Convenções e Armadilhas — AquiResolve

## Convenções que DEVEM ser seguidas

### Git
- **Commit direto em `main`** — sem branch, sem PR. Push em `main` dispara deploy automático no Vercel.
- Mensagem de commit em português (convenção do projeto)
- Nunca usar `--no-verify` nem pular hooks

### Arquivos que NUNCA vão ao GitHub
```
dashboard_admin/.env.local
app/google-services.json
app/keystore/
backend/.env
```

### Painel Admin
- **Nunca usar o Firebase client SDK para escrita crítica** — sempre usar API Routes (Admin SDK no servidor)
- Admin SDK bypassa 100% das regras Firestore
- O Express em `dashboard_admin/src/` NÃO é usado pelo frontend — as API Routes em `app/api/` são o backend real

### App Android
- **Nunca colocar lógica de negócio em Activities** — usar os `Firebase*Manager`
- Modelos Firestore usam `@PropertyName` para mapear campos com nomes diferentes

---

## Armadilhas conhecidas (evite perder tempo)

### 1. FIREBASE_PRIVATE_KEY no Render
A chave PEM deve ter `\n` LITERAL no campo do Render (não quebras de linha reais).

**Correto:**
```
-----BEGIN PRIVATE KEY-----\nMIIEvgI...==\n-----END PRIVATE KEY-----\n
```

O `backend/src/config/env.js` faz `.replace(/\\n/g, '\n')` automaticamente.

### 2. tsc --noEmit falha no dashboard_admin
O painel usa resolução de tipos do Next.js (`next/server`) que o `tsc` standalone não encontra.  
**Não é um bug introduzido por você.** Para verificar a build, usar `npm run build` dentro de `dashboard_admin/`.

### 3. node_modules não instalado no dashboard_admin
Se o ambiente for novo, fazer `cd dashboard_admin && npm install` antes de qualquer build.

### 4. Drawable ic_arrow_right vs ic_arrow_forward
No projeto existe `ic_arrow_right` mas NÃO `ic_arrow_forward`. Usar `ic_arrow_right` no XML.

### 5. Provider vs prestador (campo no Firestore)
O campo no documento do prestador pode ser `nome`, `name` ou `fullName`. Sempre verificar os 3.  
No painel: `d.nome || d.name || d.fullName || ''`

### 6. Admin SDK no painel não precisa de custom claims
O Firebase Admin SDK bypassa TODAS as regras Firestore. Mas o client SDK (usado nas páginas que fazem leitura direta) precisa dos claims `{ role: 'admin' }` para funcionar com as regras.

### 7. Coleção notifications — criação bloqueada ao client SDK
Se o app tentar criar uma notificação diretamente → erro de permissão. Notificações são criadas APENAS pelo servidor (via Admin SDK no painel ou no backend).

### 8. providerBalance vs totalEarnings
O campo correto para saldo do prestador é `providerBalance` (incrementado pelo painel ao concluir pedido).  
`totalEarnings` pode existir em documentos antigos mas é o campo legado. Usar `providerBalance` com fallback para `totalEarnings`.

### 9. cashbackBalance não é atualizado automaticamente pelo app
O cashback é calculado e creditado APENAS pelo servidor (painel admin via API Route `PATCH /api/orders/[id]` quando `status = completed`). O app só lê o campo `cashbackBalance` do Firestore.

### 10. Regra do Firestore para providers — write
Prestadores podem atualizar o próprio documento, mas `provider_verifications` é `write: if false` — só Admin SDK pode escrever lá.

---

## Ordem correta para ativar o checklist completo

O fluxo correto do checklist é:
1. `ChecklistActivity` (perguntas + avarias + resolução + declaração)
2. `PhotoEvidenceActivity` (fotos)
3. `DigitalSignatureActivity` (assinaturas)
4. Confirmação mútua: `providerCompletionConfirmed = true` + `clientCompletionConfirmed = true`
5. Painel ou backend muda para `status = completed`

**Problema atual:** a navegação para `ChecklistActivity` não é sempre obrigatória antes de `completed`. Ver item #1 em `01_O_QUE_FALTA.md`.

---

## Variáveis de ambiente por ambiente

### Local (desenvolvimento)
- `dashboard_admin/.env.local` — copiar do `.env.local.example` e preencher
- `backend/.env` — copiar do `.env.example` e preencher com chaves sandbox
- App Android: `google-services.json` de desenvolvimento na pasta `app/`

### Produção
- Painel (Vercel): variáveis configuradas no painel do Vercel (não em arquivo)
- Backend (Render): variáveis configuradas no painel do Render (`sync: false`)
- App Android: `google-services.json` de produção, keystore em `app/keystore/`
