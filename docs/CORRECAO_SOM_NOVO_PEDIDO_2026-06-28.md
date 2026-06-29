# Correção: alerta sonoro de novo pedido não tocava (nem com app aberto) — 2026-06-28

## Sintoma
O som contínuo de novo pedido não disparava — nem com o app aberto. Deveria tocar,
sem parar, para **todos os prestadores disponíveis do nicho** (mesmo com o app
fechado), parando **para todos** quando alguém aceita e **só para quem recusou**
quando um prestador recusa.

## Causa raiz (bug concreto)
O app tem `targetSdk 35` (Android 15). O `AlertForegroundService` — que mantém o
processo vivo enquanto o `NewOrderSoundHelper` toca o som contínuo — declara
`foregroundServiceType="dataSync"`, **mas o Manifest não declarava a permissão
`FOREGROUND_SERVICE_DATA_SYNC`** (obrigatória desde a API 34).

No Android 14+, `startForeground()` de um serviço `dataSync` **sem** essa permissão
lança `SecurityException`. Como o `startContinuousPlay()` inicia esse serviço **antes**
de manter o loop de áudio, o serviço quebrava e o som não se sustentava — em qualquer
aparelho Android 14/15, com app aberto ou fechado. (Em Android ≤13 não havia o
requisito, por isso "funcionava antes / em aparelho antigo".)

## Correções
**App:**
1. **Permissão `FOREGROUND_SERVICE_DATA_SYNC`** adicionada ao Manifest.
2. `AlertForegroundService` agora chama `startForeground` com o **tipo explícito**
   (`FOREGROUND_SERVICE_TYPE_DATA_SYNC`, API 29+) **dentro de try/catch** — se o
   sistema recusar o FGS, o processo **não cai** e o som segue tocando.
3. `AlertForegroundService.start()` também protegido por try/catch.
4. Lógica de decisão do alerta extraída para o módulo **puro** `utils/OrderAlertLogic`
   (status disponível, recusa por-prestador, "só os novos alertam", parar no aceite/
   saída de disponível) — o `ProviderNewOrderAlertManager` passou a delegar a ele.
   Comportamento idêntico, agora **testável em JVM**.

**Backend (`provider-notification.service.js`):**
5. Seleção/mensagem extraídas para `utils/provider-notification-logic` (puro/testável).
6. Token resolvido por `resolveUserFcmToken` (fcm_tokens → users.fcmToken → fallback),
   não mais só `fcm_tokens` — alcança prestadores cujo token está só em `users`.
7. Mantida a mensagem **DATA-ONLY + priority high** (acorda o app fechado → som contínuo).

## Comportamento garantido (inalterado, agora provado por teste)
- **Toca para o nicho:** backend faz multicast a todos os prestadores aprovados+
  disponíveis cujo `services` contém o nicho do pedido (`serviceName`).
- **Contínuo mesmo fechado:** FCM data-only acorda o app → `onMessageReceived` →
  `startContinuousPlay` (loop) + `AlertForegroundService` mantém vivo.
- **Para para todos no aceite:** ao virar `assigned`, o `setupOrderAcceptedListener`
  (Firestore) detecta e chama `stopSound(orderId)` em cada app.
- **Recusa é por-prestador:** `RejectOrderReceiver` grava `arrayUnion(rejectedBy, uid)`
  e para o som **só localmente**; o status do pedido **não muda**, então os demais
  prestadores continuam ouvindo. O listener filtra `rejectedBy.contains(uid)`.

## Validação (100% via código + ao vivo)
- **Testes unitários do app** (`OrderAlertLogicTest`, `./gradlew testDebugUnitTest`):
  **11/11** — match de "Elétrica" (com acento/caixa), recusa por-prestador, só-novos-
  alertam, parar no aceite, NÃO parar enquanto distribuindo.
- **Testes do backend** (`node --test test/provider-notification-logic.test.js`):
  **7/7** — nicho (serviceName/serviceCategory), elegibilidade (aprovado+disponível,
  exclui offline), payload data-only + priority high.
- **Validação ao vivo** (`scripts/validate-order-alert-live.js`, Firestore de produção):
  **Elétrica = 30 prestadores aprovados+disponíveis com token FCM** (de 32). Todos os
  17 nichos com prestadores têm alvos alcançáveis.
- **Envio FCM real em dry-run** (`validateOnly`, **sem entregar nada** aos usuários):
  Firebase **aceitou 9/10** da amostra Elétrica (1 token expirado =
  `registration-token-not-registered`, tratado pelo multicast). Prova o payload + tokens.
- **Build:** `assembleDebug` e suíte completa **BUILD SUCCESSFUL**.

> Observação: o som depende do pedido chegar a `distributing` (pós-pagamento). Se o
> pagamento não confirma (PIX `action_forbidden` na conta Pagar.me), o pedido não
> distribui e nada toca — isso é o bloqueador de pagamento, separado deste fix.

## Publicação
| Alvo | Mudou? | Ação |
|---|---|---|
| **GitHub** (Delta `main` + alvaro) | Sim | push |
| **Render** (backend — itens 5–7) | Sim | deploy manual |
| **Firebase / Vercel** | Não | nada a publicar (sem mudança de regras/painel) |
| **APK debug** | Sim | **gerado** (itens 1–4 exigem APK) |
