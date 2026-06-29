# Correções: mensagem do admin caindo na conta de cliente + reabrir na conta de prestador — 2026-06-28

Duas correções, ambas **100% no app** (Kotlin/layout/manifest). **Nada** muda no
painel, backend ou regras Firestore — logo, **nada a publicar em Vercel/Render/Firebase**.
Efeito só após **novo APK** (não gerado nesta rodada, a pedido).

---

## 1. Mensagem da Central para o PRESTADOR caía na conta de CLIENTE — CORRIGIDO

**Sintoma:** o admin manda uma mensagem ao prestador pelo painel; o prestador é
notificado, mas ao abrir vê a caixa da **conta de cliente** (vazia / com mensagens
de cliente), não a mensagem do admin.

**Causa raiz:** o app só tinha a tela `ClientCentralChatActivity`, que lê
`client_chats/{uid}`. A notificação `provider_message` abria a `HomeActivity` com
`open_provider_chat=true`, que por sua vez abria justamente a **Central do cliente**
(`ClientCentralChatActivity`). Mas a mensagem do admin ao prestador é gravada em
`provider_chats/{uid}` (coleção do prestador). Ou seja: o prestador era jogado na
caixa errada — "recebia na conta de cliente".

**Correção (app):**
- `CentralChatRepository` agora atende as **duas pontas** via `isProvider: Boolean`
  (default `false`, retrocompatível): cliente → `client_chats`/`unreadByClient`/
  `senderType='client'`; prestador → `provider_chats`/`unreadByProvider`/
  `senderType='provider'`; o `markRead` chama o endpoint certo
  (`/api/provider-chats/{id}/read?role=provider`).
- Nova tela `ProviderCentralChatActivity` (espelha a do cliente, reutiliza o layout
  `activity_client_central_chat` e o `CentralChatAdapter`) lendo `provider_chats/{uid}`.
- `FirebaseMessagingService`: `provider_message` agora abre **`ProviderCentralChatActivity`**
  direto (com `FLAG_ACTIVITY_NEW_TASK`, funciona com app fechado). `HomeActivity`
  (`open_provider_chat`) também passou a abrir a tela do prestador.
- **Ponto de entrada proativo:** ícone de chat no topo da `ProviderHomeActivity`
  (`btnCentralChat`) com **badge de não lidas** (observa `unreadByProvider`), para o
  prestador abrir/responder a Central sem depender da notificação.

**Regras Firestore:** já permitiam o prestador ler `provider_chats/{uid}` e criar a
própria mensagem (`senderType='provider'`); os `create` não usam `hasOnly`, então os
campos extras (`type`, `readBy*`, `createdAt`) passam. **Nada a mudar/publicar.**

**Painel:** já gravava certo (em `provider_chats` + FCM `type='provider_message'`).
O bug era exclusivamente o roteiro de telas no app.

## 2. Prestador reabria o app na conta de CLIENTE — CORRIGIDO

**Sintoma:** quem usa o app como **prestador** e fecha o app deveria reabrir como
prestador; às vezes reabria como cliente.

**Causa raiz:** o `MainActivity.checkAutoLogin` decidia a tela só por
`users/{uid}.userType`, e usava `refreshed?.userType ?: userData.userType` — se o
Firestore devolvesse `userType` **em branco** (campo ausente), o resultado era `""`
e caía na `HomeActivity` genérica (cara de cliente). Não havia memória do papel com
que o usuário estava usando o app.

**Correção (app):**
- Novo `active_role` persistido em `SharedPreferences` (`FirebaseAuthManager.setActiveRole`/
  `getActiveRole`), **gravado a cada entrada** em `ProviderHomeActivity` (provider) e
  `ClientHomeActivity` (client) — e na troca legada de `HomeActivity`. Limpo no logout.
- `MainActivity` agora resolve a conta por prioridade robusta:
  **1)** `active_role` (reflete a última conta realmente usada) →
  **2)** `userType` do Firestore → **3)** `userType` local →
  **4)** dedução pela existência de `providers/{uid}` (último recurso).
  Valores em branco são ignorados. Login manual usa a mesma dedução (prestador sem
  `userType` não vai mais parar na home de cliente).

**Resultado:** o app reabre **na mesma conta** em que foi fechado, mesmo com
`userType` ausente/desatualizado no Firestore.

---

## Arquivos tocados (todos em `app/`)
- `CentralChatRepository.kt` — suporte a prestador (`isProvider`).
- `ProviderCentralChatActivity.kt` — **novo** (registrado no `AndroidManifest.xml`).
- `FirebaseMessagingService.kt` — `provider_message` → tela do prestador.
- `HomeActivity.kt` — `open_provider_chat` → tela do prestador; troca legada grava `active_role`.
- `ProviderHomeActivity.kt` — botão Central + badge de não lidas; grava `active_role`.
- `ClientHomeActivity.kt` — grava `active_role`.
- `MainActivity.kt` — roteamento robusto por `active_role`.
- `FirebaseAuthManager.kt` — `active_role` (set/get/limpeza no logout).
- `res/layout/activity_provider_home.xml` — ícone de chat + badge no topo.

## Publicação
| Alvo | Mudou? | Ação |
|---|---|---|
| **GitHub** (Delta `main` + alvaro) | Sim | push |
| **Vercel / Render / Firebase** | Não | nada a fazer |
| **APK** | App | **NÃO gerado** (a pedido) — efeito só após APK novo |

**Validação:** `./gradlew compileDebugKotlin` → **BUILD SUCCESSFUL**.
