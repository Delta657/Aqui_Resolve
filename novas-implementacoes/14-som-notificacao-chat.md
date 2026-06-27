# 14 — Som de Notificação para Chat Cliente↔Prestador

**Data:** 2026-06-27
**Status:** Implementado

## Problema

Quando um prestador enviava mensagem no chat do pedido, o celular do cliente **não fazia som**. E vice-versa. O chat cliente↔prestador salvava as mensagens no Firestore sem enviar notificação push ao destinatário.

## Solução

Pipeline completo: salvar mensagem → backend envia FCM com som → Android toca notificação.

## Fluxo

```
Usuário A envia mensagem no chat do pedido
    ↓
FirebaseChatManager.saveMessage() salva no Firestore
    ↓
notifyRecipient() chama backend
    ↓
POST /api/chat-notify (Render)
    ↓
Backend busca FCM token do destinatário em userTokens/{uid}
    ↓
Firebase Admin send() com android.priority=high + sound=default + channelId=messages_channel
    ↓
Android FirebaseMessagingService recebe FCM
    ↓
Identifica type=chat_message → canal messages_channel (IMPORTANCE_HIGH, som sempre toca)
    ↓
Toque no celular + heads-up notification
    ↓
Toque abre ChatActivity → redireciona para ClientChatActivity ou ProviderChatActivity
```

## Arquivos modificados/criados

### Backend (Render)

| Arquivo | Alteração |
|---|---|
| `backend/src/routes/chat-notify.routes.js` | **Novo** — `POST /api/chat-notify` (autenticado, busca token FCM, envia com som) |
| `backend/src/app.js` | +1 import + rota `/api/chat-notify` |

### Android

| Arquivo | Alteração |
|---|---|
| `app/.../FirebaseChatManager.kt` | +notifyRecipient() — após salvar msg, chama backend com OkHttp |
| `app/.../FirebaseMessagingService.kt` | +type `chat_message` no isMessageType, +rota para ChatActivity |

### FCM Payload

```json
{
  "token": "...",
  "notification": { "title": "Nome do Remetente", "body": "preview da mensagem..." },
  "data": { "type": "chat_message", "order_id": "abc123", ... },
  "android": {
    "priority": "high",
    "notification": { "sound": "default", "channelId": "messages_channel" }
  }
}
```

## Build

- Android `compileDebugKotlin`: **SUCCESS** (5s, sem erros)
- Backend `node --check`: **OK**

## Deploy

Backend precisa ser redeployado no Render (autoDeploy OFF, via webhook ou manual). O Android não gera APK sem ordem explícita do Álvaro.

## Detalhes técnicos

- **Não notifica admin** (painel tem seus próprios canais)
- **Não notifica remetente** (check `recipientUid == message.senderId`)
- **Timeout 10s** no OkHttp — notificação assíncrona, nunca bloqueia envio da mensagem
- **Canal messages_channel** já existia no Android com `IMPORTANCE_HIGH` — som funciona independente do toggle `notification_sound_enabled`
- **URL:** backend na raiz (`/api/chat-notify`), não sob `/payments/`
