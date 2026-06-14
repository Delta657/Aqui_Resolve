# Checklist do prestador — mobile, painel admin, Firebase e Render

## Escopo

Este documento registra o contrato operacional do checklist de Ordem de Serviço preenchido pelo prestador no app Android e consumido pelo painel administrativo.

## Fluxo mobile

1. O prestador abre o pedido no app Android.
2. Ao iniciar a OS, `OrderDetailsActivity` chama `FirebaseOrderManager.startService(orderId)`.
3. Se o pedido já estiver `in_progress`, a chamada é tratada como sucesso idempotente. Isso permite que o prestador crie/continue a OS mesmo quando o cliente já marcou o serviço como iniciado.
4. `FirebaseChecklistManager.startService(orderId, latitude, longitude)` cria/mescla o documento `checklists/{orderId}` com:
   - `orderId`
   - `providerId`
   - `status = checklist_pending`
   - `startedAt`
   - `startLatitude` e `startLongitude` quando disponíveis
5. `ChecklistActivity` grava respostas, serviços realizados, avarias pré-existentes, resolução do problema, declaração e relatório.
6. `PhotoEvidenceActivity` grava fotos em `order_images/{orderId}/...` no Firebase Storage e URLs em:
   - `photosBefore`
   - `photosDuring`
   - `photosAfter`
   - `photoTimestampsBefore`
   - `photoTimestampsDuring`
   - `photoTimestampsAfter`
7. `DigitalSignatureActivity` grava assinaturas e conclui o checklist.

As gravações de respostas, fotos e assinaturas usam `set(..., SetOptions.merge())`, então o fluxo não falha se o documento tiver sido criado parcialmente ou por uma versão antiga do app.

## Fonte de dados no Firebase

Fonte canônica do app mobile:

```text
checklists/{orderId}
```

Status do checklist mobile:

| Status | Significado |
|---|---|
| `checklist_pending` | Prestador ainda está preenchendo dados textuais |
| `photos_pending` | Checklist textual salvo, fotos pendentes |
| `signatures_pending` | Fotos salvas, assinaturas pendentes |
| `completed` | Fotos e assinaturas salvas, OS concluída |

Storage usado pelo fluxo:

```text
order_images/{orderId}/{arquivo}
```

As regras atuais permitem:

- leitura de `checklists/{orderId}` para usuário autenticado;
- criação de `checklists/{orderId}` quando `request.resource.data.orderId == orderId`;
- atualização de checklist para usuário autenticado;
- upload/leitura de imagens em `order_images/{orderId}` para usuário autenticado.

## Painel admin

O painel agora lê dois formatos:

1. `checklists/{orderId}`: contrato mobile atual.
2. `orders/{orderId}/checklists/{checklistId}`: contrato legado/configurável do dashboard.

O adaptador em `dashboard_admin/lib/services/firebase-checklists.ts` normaliza o documento mobile para o tipo `ServiceChecklist`, usado pelo modal do pedido, pelo painel de checklist e pelo PDF da OS.

Mapeamento principal:

| Mobile | Admin |
|---|---|
| `serviceDescription` | `servicosRealizados` e resposta "Serviços realizados" |
| `preExistingDamages` | `avariasPreExistentes` |
| `problemResolution = resolved` | `statusFechamento = concluido_sucesso` |
| `problemResolution = return_needed` | `statusFechamento = retorno_pendente` |
| `problemResolution = not_resolved` | `statusFechamento = nao_concluido_sem_retorno` |
| `photosBefore/During/After` | galeria `fotos` por fase |
| `providerSignatureUrl/clientSignatureUrl` | assinaturas digitais |

O PDF aceita assinatura em base64 (`data:`) e URL do Firebase Storage.

## Render

O Render hospeda apenas o backend de pagamentos em `https://aquiresolve.onrender.com`.

O fluxo de checklist não depende de endpoint do Render. A relação indireta é:

- o app Android usa `PAYMENTS_API_BASE_URL` apontando para Render para pagamentos;
- o checklist usa Firebase Firestore/Storage diretamente;
- o backend no Render precisa manter variáveis Firebase Admin válidas para rotinas de pagamento/catálogo, mas não processa o checklist de OS.

Configuração Render versionada:

```text
backend/render.yaml
healthCheckPath: /api/health
rootDir: backend
branch esperada: main
```

Se houver mudança em `backend/`, o deploy do Render precisa ser disparado manualmente, pois o serviço está com auto deploy desligado.

## Validação recomendada

1. Criar/usar um pedido atribuído a prestador.
2. No app, iniciar a OS como prestador.
3. Preencher checklist, fotos e assinaturas.
4. Confirmar no Firestore que existe `checklists/{orderId}` com status esperado.
5. Abrir o pedido no painel admin e validar que o bloco "Checklist" mostra respostas, fotos, desfecho e assinaturas.
6. Gerar/visualizar PDF da OS no painel.
7. Verificar `https://aquiresolve.onrender.com/api/health` somente para saúde do backend de pagamentos.
