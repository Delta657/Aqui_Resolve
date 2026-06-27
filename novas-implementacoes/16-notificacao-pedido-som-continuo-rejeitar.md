# Notificação de Novo Pedido: Som Contínuo + Botão Rejeitar

**Data:** 2026-06-27

---

## O que foi implementado

### 1. Som contínuo até aceitar ou rejeitar
O som de alerta de novo pedido agora toca **em loop contínuo** até que:
- Algum prestador **aceite** o pedido (status → `assigned`)
- O prestador **rejeite** o pedido (via botão na notificação ou no app)
- O pedido mude de status (expirado, cancelado, etc.)

**Arquivo:** `app/src/main/java/com/aquiresolve/app/utils/NewOrderSoundHelper.kt`
- Novo método `startContinuousPlay(context, orderId)` — inicia loop
- Novo método `stopSound(orderId?)` — para o som
- Usa `MediaPlayer.isLooping = true` (loop nativo)

### 2. Botões Aceitar/Rejeitar na notificação
A notificação heads-up de novo pedido agora tem **2 botões de ação**:
- **Aceitar** → abre a tela de detalhes do pedido (`OrderDetailsActivity`)
- **Rejeitar** → dispara `RejectOrderReceiver` que marca o pedido como rejeitado via Firestore

**Arquivo:** `app/src/main/java/com/aquiresolve/app/ProviderNewOrderAlertManager.kt`
- `showHeadsUpNotification()` agora cria `PendingIntent` separados para cada ação
- Notificação usa `setOngoing(true)` + `setCategory(CATEGORY_ALARM)` para máxima visibilidade

### 3. BroadcastReceiver para rejeição
`RejectOrderReceiver` processa a ação de rejeitar:
- Adiciona o UID do prestador ao array `rejectedBy` no Firestore
- Para o som contínuo
- Atualiza o monitoramento

**Novo arquivo:** `app/src/main/java/com/aquiresolve/app/RejectOrderReceiver.kt`

### 4. Monitoramento automático de aceitação
Quando um alerta é disparado, um listener Firestore monitora os pedidos alertados.
Se o status mudar para `assigned` (aceito por alguém), o som para automaticamente.

### 5. Filtro de rejeitados
Os pedidos rejeitados não aparecem mais para o prestador:
- `ProviderHomeActivity.shouldIncludeOrderForProvider()`
- `ProviderOrdersFragment.shouldIncludeOrderForProvider()`
- `ProviderNewOrderAlertManager` snapshot listener

Verifica `order.rejectedBy.contains(providerId)`.

### 6. Rejeição corrigida no app
O botão "Rejeitar" dentro do app (`ProviderOrdersFragment.rejectOrder()`) foi corrigido:
- **Antes:** mudava o status do pedido inteiro para `"rejected"` (sumia para todos)
- **Agora:** adiciona o UID ao array `rejectedBy` (some só para este prestador)

### 7. Campo `rejectedBy` no modelo
**Arquivo:** `app/src/main/java/com/aquiresolve/app/models/OrderData.kt`
- Novo campo: `@PropertyName("rejectedBy") val rejectedBy: List<String> = emptyList()`

---

## Arquivos modificados

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `NewOrderSoundHelper.kt` | editado | +métodos de loop contínuo |
| `ProviderNewOrderAlertManager.kt` | editado | +botões na notificação, +listener de aceite, +filtro rejectedBy |
| `RejectOrderReceiver.kt` | **novo** | BroadcastReceiver para ação rejeitar |
| `OrderData.kt` | editado | +campo `rejectedBy` |
| `ProviderHomeActivity.kt` | editado | +filtro `rejectedBy` no `shouldIncludeOrderForProvider` |
| `ProviderOrdersFragment.kt` | editado | +filtro `rejectedBy`, correção `rejectOrder` |
| `AndroidManifest.xml` | editado | registro do `RejectOrderReceiver` |
| `ProviderVerificationManager.kt` | editado | fix: reconhece `"approved"` como APPROVED |

## Fluxo completo

```
1. Cliente cria pedido → status: "distributing"
2. ProviderNewOrderAlertManager detecta → dispara alerta
3. Som contínuo começa (MediaPlayer em loop)
4. Notificação aparece com botões [Aceitar] [Rejeitar]
5a. Prestador toca "Aceitar" → OrderDetailsActivity → acceptOrderAsProvider()
    → status muda para "assigned" → listener detecta → som PARA
5b. Prestador toca "Rejeitar" → RejectOrderReceiver → arrayUnion no rejectedBy
    → som PARA → pedido some da lista deste prestador
5c. Outro prestador aceita → listener detecta status="assigned" → som PARA
```
