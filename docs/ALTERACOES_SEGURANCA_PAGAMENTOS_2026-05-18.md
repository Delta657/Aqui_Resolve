# Alterações de segurança, pagamentos e precificação — 2026-05-18

Este documento registra o conjunto de mudanças feitas antes do envio ao GitHub, com foco em retirar decisões sensíveis do APK Android e centralizar regras críticas no backend.

## Objetivos da alteração

- Impedir que um APK modificado consiga marcar pedidos como pagos diretamente no Firestore.
- Fazer a confirmação final de pagamento passar pelo backend, consultando a Pagar.me e/ou recebendo webhook.
- Centralizar preço do serviço e repasse do prestador no backend, evitando confiar em valores calculados pelo cliente Android.
- Restringir regras do Firestore para permitir apenas transições esperadas por cliente/prestador.
- Evitar corrida no aceite de pedidos por prestadores.
- Preservar o fluxo atual do app, mas com backend como fonte de verdade para campos sensíveis.

---

## Backend de pagamentos

### Novo serviço de sincronização

Arquivo criado:

- `backend/src/services/payment-status-sync.service.js`

Responsabilidades:

- Derivar o `paymentStatus` a partir do retorno real da Pagar.me.
- Considerar status em:
  - `order.status`
  - `charges[].status`
  - `charges[].last_transaction.status`
  - `charges[].lastTransaction.status`
  - `order.last_transaction.status`
  - `order.lastTransaction.status`
- Mapear pagamentos aprovados para:
  - `paymentStatus = paid`
  - `status = distributing`
  - `paymentConfirmedBy = backend`
  - `confirmedAt = serverTimestamp()`
- Mapear pagamentos pendentes/falhos/cancelados para:
  - `paymentStatus = pending`, `failed` ou `canceled`
  - `status = awaiting_payment`
  - remoção de `confirmedAt`
- Atualizar pedidos no Firestore via Firebase Admin SDK, fora das permissões do app cliente.
- Sincronizar checkout de carrinho por `cartCheckoutCode + clientId`.
- Remover itens do carrinho no backend depois que a transação é criada, evitando checkout duplicado.

### Webhook da Pagar.me

Arquivos alterados:

- `backend/src/controllers/payments.controller.js`
- `backend/src/routes/payments.routes.js`

Nova rota pública:

```txt
POST /api/payments/webhook/pagarme
```

Características:

- Não exige Firebase Auth, pois será chamada pela Pagar.me.
- Valida segredo compartilhado quando configurado via env:
  - `PAGARME_WEBHOOK_SECRET`
  - ou `PAYMENT_WEBHOOK_SECRET`
- Aceita segredo em:
  - header `x-pagarme-webhook-secret`
  - header `x-payment-webhook-secret`
  - header `x-webhook-secret`
  - query string `?secret=...`
- Se o segredo não estiver configurado, o webhook ainda aceita chamadas, mas registra aviso em log. Para produção, deve ser configurado.
- Extrai o ID do pedido em múltiplos formatos comuns de payload:
  - `data.id`
  - `data.order.id`
  - `data.object.id`
  - `data.object.order.id`
  - `order.id`
  - `object.id`
  - `id`
- Consulta a Pagar.me no backend antes de sincronizar o Firestore.

### Polling de status agora também sincroniza

Endpoint existente alterado:

```txt
GET /api/payments/:orderId/status
```

Agora o endpoint:

1. valida que a sessão de pagamento pertence ao usuário autenticado;
2. consulta a Pagar.me;
3. sincroniza o pedido/carrinho no Firestore pelo backend;
4. atualiza a sessão de pagamento com status derivado.

Isso permite que o PIX seja confirmado tanto por webhook quanto por polling do app enquanto a tela de pagamento está aberta.

### Criação de pagamento já inicia sincronização

Endpoints alterados:

```txt
POST /api/payments/card
POST /api/payments/pix
```

Após criar a ordem na Pagar.me, o backend agora:

1. salva `payment_sessions/{gatewayOrderId}`;
2. sincroniza o status inicial do pagamento no Firestore;
3. atualiza a sessão com `paymentStatus` e `gatewayStatus`.

Se cartão aprovar imediatamente, o pedido já pode ir para distribuição sem o APK escrever campos de pagamento.

### Correções Firebase Admin SDK

Arquivos alterados:

- `backend/src/services/payment-session.service.js`
- `backend/src/services/payment-authorization.service.js`

Correção aplicada:

- substituição de chamadas estilo Android/Kotlin `.document(id)` por `.doc(id)`, que é o método correto no Firebase Admin SDK Node.js.

---

## Backend de precificação

### Novo endpoint de cálculo de preço

Arquivos criados:

- `backend/src/controllers/pricing.controller.js`
- `backend/src/services/service-pricing.service.js`

Rota autenticada criada:

```txt
POST /api/payments/pricing/calculate
```

Payload:

```json
{
  "category": "Elétrica",
  "serviceType": "Instalação de tomada"
}
```

Resposta:

```json
{
  "category": "Elétrica",
  "serviceType": "Instalação de tomada",
  "estimatedPrice": 110,
  "providerCommission": 55,
  "source": "specific"
}
```

Fontes de preço:

- `specific`: preço encontrado diretamente na tabela do backend.
- `derived_from_provider_value`: preço do cliente derivado a partir do repasse quando a tabela tinha apenas valor do prestador.
- `default`: fallback por categoria.

Motivo:

- O app Android não deve ser a fonte final de `estimatedPrice` nem de `providerCommission`, porque esses campos impactam cobrança e repasse.

---

## Android

### Novos modelos de precificação

Arquivo criado:

- `app/src/main/java/com/aquiresolve/app/models/payment/PricingModels.kt`

Modelos adicionados:

- `PricingRequest`
- `PricingResponse`

### Retrofit/PagarMeManager

Arquivos alterados:

- `app/src/main/java/com/aquiresolve/app/api/PagarMeApiService.kt`
- `app/src/main/java/com/aquiresolve/app/payment/PagarMeManager.kt`

Mudanças:

- Adicionado método Retrofit para `POST pricing/calculate`.
- Adicionado `PagarMeManager.calculateServicePricing(...)`.
- Adicionado `PricingResult` para representar sucesso/erro do cálculo de preço no backend.

### Criação de pedido individual

Arquivo alterado:

- `app/src/main/java/com/aquiresolve/app/CreateOrderActivity.kt`

Mudanças:

- Removido cálculo final de preço/repasse usando apenas a tabela local do APK.
- Antes de criar pedido ou item de carrinho, o app agora chama o backend para obter:
  - `estimatedPrice`
  - `providerCommission`
- Removida escrita direta de campos sensíveis após pagamento:
  - `paymentStatus`
  - `transactionId`
  - `status`
  - `confirmedAt`
- Após pagamento, o app chama o backend para consultar/sincronizar status e depois lê o pedido atualizado no Firestore.

### Carrinho

Arquivos alterados:

- `app/src/main/java/com/aquiresolve/app/ClientCartActivity.kt`
- `app/src/main/java/com/aquiresolve/app/FirebaseCartManager.kt`

Mudanças:

- `FirebaseCartManager` agora recebe `Context` quando precisa chamar o backend.
- O preparo do checkout do carrinho calcula preço/repasse no backend para cada item.
- O total enviado para tela de pagamento passa a usar `session.totalAmount`, calculado a partir dos valores confirmados pelo backend.
- `checkoutCart(...)` foi mantido apenas por compatibilidade e marcado como `@Deprecated`.
- `checkoutCart(...)` não escreve mais status de pagamento nem remove itens do carrinho; isso passou para o backend.
- Após pagamento do carrinho, o app força uma consulta de status no backend quando existe `transactionId`, para acelerar a sincronização.

### Aceite de pedidos por prestador

Arquivos alterados:

- `app/src/main/java/com/aquiresolve/app/FirebaseOrderManager.kt`
- `app/src/main/java/com/aquiresolve/app/OrderDetailsActivity.kt`
- `app/src/main/java/com/aquiresolve/app/OrdersTabFragment.kt`
- `app/src/main/java/com/aquiresolve/app/ProviderOrdersFragment.kt`

Mudanças:

- Criado método centralizado `acceptOrderAsProvider(orderId)`.
- O aceite agora roda em transação Firestore única.
- A transação só permite aceitar quando:
  - pedido existe;
  - status está em `distributing`, `pending` ou `available`;
  - `assignedProvider` está vazio;
- A transação grava:
  - `assignedProvider`
  - `assignedProviderName`
  - `status = assigned`
  - `assignedAt`
  - `clientVerificationCode`
  - `providerVerificationCode`
  - `verificationCodesGeneratedAt`
  - `updatedAt`
- Telas diferentes passaram a usar a mesma função, evitando lógica duplicada e inconsistências.
- Removido log que expunha códigos de verificação em debug.

---

## Regras do Firestore

Arquivo alterado:

- `firestore.rules`

Mudanças principais:

- Criação/edição de `orders` ficou mais restrita.
- Cliente só pode criar pedido para si mesmo e com campos esperados.
- Cliente não pode mais alterar campos sensíveis de pagamento/preço depois da criação:
  - `paymentStatus`
  - `transactionId`
  - `gatewayOrderId`
  - `gatewayStatus`
  - `paymentConfirmedBy`
  - `paymentSyncedAt`
  - `estimatedPrice`
  - `providerCommission`
  - `status` fora das transições permitidas
- Cliente ainda pode fazer atualizações permitidas, como:
  - imagens;
  - cancelamento pelo cliente;
  - confirmação de conclusão;
  - avaliação/review.
- Prestador pode aceitar pedido somente se ainda estiver disponível e sem `assignedProvider`.
- Prestador pode fazer apenas transições esperadas para pedido atribuído a ele, como iniciar, concluir ou cancelar.

Observação:

- O backend usa Firebase Admin SDK e não depende dessas regras para atualizar pagamento. As regras protegem contra abuso pelo app cliente.

---

## Configuração necessária em produção

### Render

No serviço do backend, configurar:

```env
PAGARME_API_KEY=sk_...
PAGARME_WEBHOOK_SECRET=um_segredo_forte
CRON_SECRET=um_segredo_forte
```

Depois fazer redeploy do backend.

### Pagar.me

Cadastrar webhook para:

```txt
https://aquiresolve.onrender.com/api/payments/webhook/pagarme
```

Se possível, configurar header:

```txt
x-pagarme-webhook-secret: mesmo_valor_de_PAGARME_WEBHOOK_SECRET
```

Se o painel não permitir header customizado, usar temporariamente:

```txt
https://aquiresolve.onrender.com/api/payments/webhook/pagarme?secret=mesmo_valor_de_PAGARME_WEBHOOK_SECRET
```

Eventos recomendados:

- `order.paid`
- `order.payment_failed`
- `order.closed`
- `order.canceled`
- `charge.paid`
- `charge.payment_failed`
- `charge.pending`
- `charge.canceled`

---

## Checklist de teste manual

1. Criar pedido individual com PIX.
2. Pagar PIX.
3. Conferir Firestore:
   - `paymentStatus = paid`
   - `status = distributing`
   - `paymentConfirmedBy = backend`
4. Criar checkout de carrinho.
5. Confirmar que os itens do carrinho são removidos pelo backend após criação/sincronização da transação.
6. Testar cartão aprovado e recusado.
7. Testar aceite do pedido por dois prestadores quase ao mesmo tempo; apenas um deve conseguir.
8. Testar que cliente não consegue forçar `paymentStatus/status` diretamente via SDK cliente.

---

## Validações locais realizadas antes do envio

- Compilação Kotlin do app sem gerar APK final:

```bash
./gradlew :app:compileDebugKotlin
```

- Validação de módulos do backend via `require(...)`.
- Validação da derivação de status de pagamento.
- Validação de parse das regras Firestore no emulator.
- Verificação de whitespace/diff com:

```bash
git diff --check
```

