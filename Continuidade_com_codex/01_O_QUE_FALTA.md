# O que Falta Implementar — AquiResolve

Prioridade: **Alta** = bloqueia lançamento | **Média** = importante mas contornável | **Baixa** = melhoria

---

## ALTA PRIORIDADE (bloqueia lançamento)

### 1. Fluxo de conclusão real do pedido (app mobile)
**Problema:** quando o prestador clica "concluir serviço", o app ainda não força a passagem pelo checklist → fotos → assinaturas → confirmação do cliente antes de marcar `status = completed`.

**O que falta:**
- `ChecklistActivity` → `PhotoEvidenceActivity` → `DigitalSignatureActivity` → confirmação mútua (prestador + cliente marcam `providerCompletionConfirmed` e `clientCompletionConfirmed`) → só então o painel/backend muda para `completed`
- Atualmente o checklist existe mas não está obrigatoriamente no caminho antes de `completed`

**Arquivo central:** `ProviderOrdersActivity.kt`, `OrderDetailsActivity.kt`

---

### 2. Tela de avaliação pós-conclusão (RatingActivity)
**Problema:** `RatingActivity.kt` existe mas não é chamada automaticamente quando o pedido vai para `completed`.

**O que falta:**
- Após `clientCompletionConfirmed = true`, navegar para `RatingActivity` com `orderId`
- Salvar `rating`, `review`, `detailedRatings`, `ratedAt` no Firestore no documento do pedido
- Atualizar média de avaliação no documento do prestador (`providers/{uid}.rating`)

---

### 3. Pagamento: verificação automática do PIX
**Problema:** o usuário paga via PIX mas o app não muda automaticamente o `paymentStatus` de `awaiting_payment` para `paid` — o cliente fica na tela esperando.

**O que falta:**
- Polling ou webhook do Pagar.me: quando PIX é pago, backend atualiza o Firestore (`paymentStatus = "paid"`, `status = "pending"`)
- O arquivo `docs/VERIFICACAO_AUTOMATICA_PIX.md` já documenta a abordagem
- Backend: rota webhook `POST /api/webhooks/pagarme` já existe em `backend/src/routes/` mas precisa ser implementada completamente
- App: `PixPaymentActivity.kt` faz polling manual — verificar se está funcional

---

### 4. Expiração de pedidos sem aceite
**Problema:** se nenhum prestador aceitar o pedido em X horas, ele fica em `distributing` para sempre.

**O que falta:**
- Cron job no backend (Render) ou Cloud Function: pedidos com `status = distributing/pending` há mais de 2h → cancelar automaticamente + notificar cliente
- O arquivo `docs/SISTEMA_EXPIRACAO_PEDIDOS.md` documenta o design
- Rota `backend/src/routes/cron.routes.js` já existe (esqueleto)

---

### 5. Notificação push ao prestador quando novo pedido aparece
**Problema:** prestadores recebem novos pedidos somente se estiverem com o app aberto (`ProviderNewOrderAlertManager`). Se o app estiver em background/fechado, não há push.

**O que falta:**
- Ao criar pedido (ou ao passar para `distributing`), enviar FCM para TODOS os prestadores aprovados + ativos da categoria correta
- Painel admin já tem `POST /api/notifications/send` funcional
- Falta chamar esse endpoint a partir do backend quando o pedido é criado

---

### 6. Distribuição automática de pedidos por categoria
**Problema:** quando o pedido fica em `distributing`, o sistema não filtra prestadores por especialidade/serviço.

**O que falta:**
- Ao enviar push para prestadores, filtrar por `providers.services` que contenham o `serviceType` do pedido
- Implementar no backend ou em uma Cloud Function

---

## MÉDIA PRIORIDADE

### 7. Reembolso via Pagar.me
**Problema:** `CancellationRefundActivity.kt` existe mas não chama a API de reembolso do Pagar.me.

**O que falta:**
- `POST /api/payments/{orderId}/refund` no backend que chama `POST /core/v5/charges/{chargeId}/void` na Pagar.me
- Salvar `refundStatus`, `refundedAt` no Firestore

---

### 8. Dashboard Admin — páginas com esqueleto mas sem dados reais

As páginas abaixo existem no Next.js mas estão vazias/mock:
- `/dashboard/financeiro/faturamento` — sem dados reais do Pagar.me
- `/dashboard/financeiro/folha-pagamento` — sem dados
- `/dashboard/financeiro/fechamento` — sem dados
- `/dashboard/financeiro/movimento-caixa` — sem dados
- `/dashboard/configuracoes/estoque` — não aplicável ao modelo atual (pode remover)
- `/dashboard/configuracoes/equipes` — sem dados
- `/dashboard/configuracoes/filiais` — sem dados
- `/dashboard/controle/chat-operacional` — sem implementação

---

### 9. Gestão de categorias de serviço pelo painel
**Problema:** as categorias de serviço (`service_categories`, `service_types`) são estáticas no código.

**O que falta:**
- Página no admin para criar/editar/remover categorias de serviço
- App mobile: carregar categorias do Firestore em vez de lista hardcoded

---

### 10. Fluxo de cadastro do prestador mais robusto
**Problema:** o prestador se cadastra mas o processo de verificação de documentos é manual.

**O que falta:**
- Upload de documentos (RG/CPF/comprovante) já funciona (`DocumentUploadActivity`)
- Painel admin: visualizar os documentos na tela de verificação do prestador (atualmente só aprova/rejeita sem ver os docs)
- Adicionar preview dos documentos em `/dashboard/controle/aceitacao-prestadores`

---

### 11. Modo offline / cache no app Android
**Problema:** sem internet, o app não mostra nenhum dado.

**O que falta:**
- Habilitar persistência offline do Firestore (`FirebaseFirestore.getInstance().firestoreSettings` com `isPersistenceEnabled = true`)
- Está comentado ou não configurado em `FirebaseConfig.kt`

---

## BAIXA PRIORIDADE

### 12. Tela de cotações (QuotesActivity)
- Existe mas não está conectada ao fluxo real de pedidos

### 13. Tema escuro no app Android
- Cores definidas mas não há suporte a dark mode

### 14. Internacionalização (strings.xml)
- Strings hardcoded em português dentro do código Kotlin (não em `strings.xml`)
- Baixo impacto agora (app é só para o Brasil)

### 15. Testes automatizados
- **App Android:** zero testes unitários/instrumentados
- **Painel Admin:** zero testes
- **Backend:** zero testes
- Mínimo desejável: testes das regras Firestore com Firebase Emulator

### 16. CI/CD
- Não há GitHub Actions configurado
- Desejável: lint + build no PR, deploy automático apenas em merge

---

## Checklist de deploy antes do lançamento

- [ ] Configurar `PAGARME_SECRET_KEY` no Render com chave de PRODUÇÃO (hoje usa sandbox)
- [ ] Configurar `google-services.json` de produção no app (hoje pode ser de desenvolvimento)
- [ ] Deploy das regras Firestore: `firebase deploy --only firestore:rules,firestore:indexes`
- [ ] Criar usuário admin no Firebase Console (`master@aquiresolve.com`)
- [ ] Rodar `POST /api/setup-adminmaster` no painel em produção
- [ ] Verificar `FIREBASE_PRIVATE_KEY` no Render (chave PEM completa com `\n` literal)
- [ ] Publicar app na Play Store (gerar AAB de release com keystore em `app/keystore/`)
