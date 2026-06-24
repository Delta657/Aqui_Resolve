# Correção: "Erro ao carregar alertas operacionais" — Central Operacional

**Data:** 2026-06-24  
**Componente:** Central Operacional (`/dashboard/controle/chat-operacional`)  
**Severidade:** Alta — a aba inteira ficava inutilizável para o admin  

---

## Sintoma

Ao abrir a aba **Controle → Central Operacional**, a seção de alertas exibia:

> _"Erro ao carregar alertas operacionais"_

O painel mostrava o erro imediatamente após o login, sem possibilidade de recarregar.

---

## Causa Raiz

A coleção `operationalAlerts` no Firestore **não tinha nenhuma regra** definida em `firestore.rules`.

O arquivo de regras termina com um fallback explícito:

```
match /{document=**} {
  allow read, write: if false;
}
```

Esse fallback capturava todas as consultas à `operationalAlerts` e as bloqueava com `PERMISSION_DENIED`.

O hook `useOperationalAlerts` (`dashboard_admin/hooks/use-operational-alerts.ts`) usa o **client SDK do Firebase** (`onSnapshot`) para assinar a coleção em tempo real. Quando o Firestore retorna `PERMISSION_DENIED`, o callback de erro do `onSnapshot` é acionado, definindo a mensagem genérica `"Erro ao carregar alertas operacionais"`.

### Por que `isAdmin()` não pode ser usado aqui

A função `isAdmin()` nas regras verifica o custom claim `{ role: 'admin' }` ou `{ admin: true }` no token do Firebase Auth. Por padrão, os administradores do painel **não recebem esse claim** — eles são criados via Firebase Auth normal e validados contra a subcoleção `adminmaster/master/usuarios` via Admin SDK no servidor (não via custom claims no client SDK).

Portanto, a regra deve usar `isSignedIn()` (qualquer usuário autenticado), que é o mesmo padrão das coleções internas como `chatConversations`, `chats` e `orders`.

---

## Correção Aplicada

### 1. `firestore.rules` — nova regra para `operationalAlerts`

```
match /operationalAlerts/{alertId} {
  allow read, write: if isSignedIn();
}
```

Adicionada antes do bloco `adminLogs`, com comentário explicando a decisão de usar `isSignedIn()` em vez de `isAdmin()`.

### 2. `dashboard_admin/hooks/use-operational-alerts.ts` — erro handler melhorado

O callback de erro do `onSnapshot` passou a:
- Logar `firestoreError.code` e `firestoreError.message` no console (`console.error`)
- Exibir mensagem específica para `permission-denied` (diferencia falha de regra de falha de rede)

---

## Arquivos Alterados

| Arquivo | Tipo de mudança |
|---|---|
| `firestore.rules` | Nova regra `operationalAlerts` |
| `dashboard_admin/hooks/use-operational-alerts.ts` | Error handler com log e mensagem diferenciada |

---

## Deploy Necessário

A correção exige publicar as regras do Firestore:

```bash
firebase deploy --only firestore:rules
```

Ou via skill:

```
/aquiresolve-firebase → publicar regras
```

O painel (Vercel) **não precisa de redeploy** — a mudança é só nas regras do Firestore.

---

## Como Evitar no Futuro

Toda nova coleção do Firestore usada pelo client SDK do painel **deve ter uma regra explícita** em `firestore.rules`. O fallback `allow read, write: if false` é intencional e bloqueia tudo não coberto.

Checklist ao criar uma nova coleção:
1. Definir regra em `firestore.rules` (mínimo: `allow read: if isSignedIn()`)
2. Testar com o painel em ambiente local antes de subir
3. Publicar as regras com `firebase deploy --only firestore:rules`
