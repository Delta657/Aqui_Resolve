# Correções no fluxo de Reembolso — 2026-06-28

Implementação a partir da análise do reembolso. Foco nos itens de maior impacto e
menor risco. (A taxa compensatória escalonada e o "solicitar reembolso" pós-conclusão
ficaram de fora — são mudança de produto.)

---

## A. Notificações não chegavam (coleção de token errada) — CORRIGIDO

**Causa raiz:** várias rotas liam o token FCM em `userTokens/{uid}`, mas **nada no
projeto escreve nessa coleção**. O app grava em `fcm_tokens/{uid}.token` e
`users/{uid}.fcmToken`. Resultado: o push de **"Reembolso processado"** (e também
status de pedido, webhooks Pagar.me, chat e broadcasts) **nunca era entregue**.

**Correção:** helper único que resolve o token nas fontes reais primeiro
(`fcm_tokens` → `users.fcmToken`) com fallback em `userTokens`:
- Painel: `lib/server/fcm-token.ts` → aplicado em `orders/[id]/refund`,
  `orders/[id]`, `pagarme/webhooks`, `notifications/send`,
  `client-chats/[id]/messages`, `provider-chats/[id]/messages`,
  `client-chats/broadcast`, `provider-chats/broadcast`.
- Backend: `src/utils/fcm-token.js` → aplicado em `order-expiration.service.js` e
  `chat-notify.routes.js`.

**Vale na hora** (Vercel + Render), sem APK — o app já grava nas coleções certas.

## C. Mensagens de prazo + estado do reembolso no app — CORRIGIDO

**Antes:** o app prometia "reembolsado em até 24 horas" (incoerente com a própria
Política: PIX 5 dias úteis / cartão 1–2 faturas) e **só exibia** o aviso quando
`cancelledBy=="client" && refundStatus=="pending"` — quando o admin concluía o
estorno (`refundStatus="completed"`), o card sumia, sem confirmação.

**Agora** (`OrderDetailsActivity`): o card mostra o **estado real** do reembolso
(`pending` / `processing` / `completed` / `partial` / `failed`) com textos
alinhados à Política, incluindo **"✅ Reembolso concluído"**. A mensagem de sucesso
do cancelamento também foi corrigida (sem o "24 horas"). **Exige APK novo.**

## D. Regra: cliente não marca reembolso em pedido não pago — CORRIGIDO

`validClientOrderUpdate` (ramo cancelamento) agora só aceita `refundStatus` se o
pedido **foi pago** (`paymentStatus.lower() in [paid, captured, approved,
confirmed]`). Fecha o abuso de sinalizar reembolso pendente num pedido sem cobrança.
**Não quebra** o app legítimo (que já só envia `refundStatus` quando pago).
**Publicada no Firebase.**

## Descartado nesta rodada
- **B (reembolso no cancelamento pelo prestador):** **não existe fluxo de
  cancelamento pelo prestador no app** (ambos os caminhos usam `cancelledBy=client`;
  o admin trata no-show pelo painel, que já reembolsa). Implementar seria
  infraestrutura especulativa.
- **Taxa compensatória escalonada (10%/30%)** e **"solicitar reembolso" pós-conclusão
  (vício/defeito, §8)** — mudança de produto, fora do escopo de correção.

---

## Publicação

| Plataforma | Mudou? | Ação |
|---|---|---|
| **GitHub** (Delta `main` + alvaro) | Sim | push |
| **Vercel** (painel — A) | Sim | deploy |
| **Render** (backend — A) | Sim | deploy manual |
| **Firebase** (regras — D) | Sim | publicada (ruleset `1a354cb9…`) |
| **APK** (C) | App | **NÃO gerado** (a pedido) — efeito só após APK novo |

**Validação:** `node -c` backend OK; `compileDebugKotlin` OK; `next build` OK;
regras criadas/publicadas com sucesso (validou `.lower()`/`in`).
