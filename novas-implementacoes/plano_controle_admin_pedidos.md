# Plano de Implementação: Painel de Controle de Pedidos em Andamento (Admin)

> ✅ **IMPLEMENTADO em 2026-06-23** — aba **Monitoramento de Pedidos** no painel admin.
> Rota: `/dashboard/controle/monitoramento` (sidebar grupo **Controle**, ícone `Activity`).
>
> **O que foi entregue (tempo real, sem cron/backend novo):**
> - **Dashboard ao vivo** via Firestore client SDK (`onSnapshot` em `orders` com `status in` dos
>   monitoráveis) + KPIs (em andamento / aguardando prestador / a caminho / em atendimento / com alerta)
>   e filtros (Todos · Com alerta · Aguardando · A caminho · Em atendimento).
> - **Geolocalização em tempo real** do prestador: assina `users/{providerId}` (`latitude`/`longitude`/
>   `lastLocationUpdate`), calcula **distância (haversine) até o cliente**, frescor do GPS e link Google Maps.
> - **Detecção de ociosidade** (regra central do plano) em `lib/order-monitoring.ts` (lógica pura,
>   testada em `tests/order-monitoring.test.ts`): alerta quando o prestador **aceitou há > 10 min e não
>   se deslocou** (baseline de posição capturada no cliente, deslocamento < 150 m) **ou** a **localização
>   está parada > 15 min**; também alerta **sem prestador > 20 min** na distribuição e **aguardando
>   pagamento > 30 min**. Alerta **visual** (borda vermelha + chips) **e sonoro** (bipe WebAudio ao surgir
>   um novo alerta; botão de silenciar).
> - **Ações do admin:** **reatribuir** (a outro prestador ou de volta à fila) via `POST /api/orders/[id]/redirect`,
>   **cancelamento administrativo** via `PATCH /api/orders/[id]` (motivo obrigatório), **contato rápido**
>   (ligar prestador/cliente por `tel:` + atalho para o Chat com Prestadores).
> - **Permissões:** consulta exige `gestaoPedidos`; ações (reatribuir/cancelar) exigem `operarPedidos`
>   (botões escondidos sem a permissão). Rota mapeada em `lib/admin-permissions.ts`.
>
> **Decisão de arquitetura:** dispensamos o cron/worker e os WebSockets do plano original — o
> `onSnapshot` do client SDK já entrega tempo real e a detecção de ociosidade roda no cliente (ticker
> de 20 s + baseline em memória), reaproveitando o padrão do `OrderInsightsPanel`. Itens 5.1/5.2 do
> plano (logs de localização e cron no backend) ficam **opcionais/futuros** — hoje não são necessários.

## 1. Visão Geral
O objetivo deste plano é criar uma aba específica no painel do administrador focada no monitoramento em tempo real dos pedidos em andamento. A funcionalidade visa dar controle total ao administrador sobre o status dos serviços, localização dos prestadores e identificação proativa de problemas (ex: prestador ocioso após aceitar o pedido).

## 2. Requisitos da Interface (Aba "Monitoramento de Pedidos")
- **Dashboard Centralizado:** Uma nova aba no painel admin onde todos os pedidos com status "Em Andamento" ou "Aceito" são listados.
- **Informações do Pedido:** 
  - Código único do pedido.
  - Nome do cliente e do prestador alocado.
  - Horário de aceitação do pedido.
- **Geolocalização em Tempo Real:** 
  - Exibição de um mapa (opcional) ou status em texto de onde o prestador está no momento.
  - Distância estimada ou tempo até o cliente.

## 3. Sistema de Alertas e Regras de Negócio
- **Detecção de Ociosidade (Prestador não se deslocou):**
  - Implementar um rastreamento contínuo (via GPS do app do prestador) que compara a localização do aceite com a localização atual a cada *X* minutos.
  - Se o prestador aceitar o pedido e sua localização não mudar significativamente em *Y* minutos, o sistema deve disparar um alerta visual e sonoro no painel do admin.
- **Notificações para o Admin:**
  - "Aviso: O prestador [Nome] do pedido [Código] aceitou o serviço há 10 minutos mas não iniciou o deslocamento."

## 4. Ações Disponíveis para o Admin
- **Reatribuição de Pedido:** Botão rápido para remover o prestador atual (com ou sem penalidade/aviso automático) e disparar o pedido novamente para a fila ou atribuir manualmente a outro prestador próximo.
- **Contato Rápido:** Botões para iniciar chat/ligação direta com o cliente ou com o prestador para entender o atraso.
- **Cancelamento Administrativo:** Opção de cancelar o pedido com justificativa.

## 5. Fluxo de Implementação Sugerido
1. **Banco de Dados:** Adicionar campos para logs de localização do prestador e timestamps precisos de mudança de status (aceite, em deslocamento, no local).
2. **Backend:** 
   - Criar rotas para receber atualizações de localização do app do prestador (background tracking).
   - Implementar um cron job ou worker para verificar continuamente as regras de ociosidade e criar notificações (eventos) para o painel admin.
3. **Frontend (Admin):** 
   - Criar a nova aba "Monitoramento de Pedidos".
   - Integrar WebSockets ou polling para atualizar os dados e alertas em tempo real.
4. **Aplicativo do Prestador:** 
   - Garantir que a permissão de localização em background esteja ativa enquanto o pedido estiver "em andamento".

## 6. Próximos Passos
- Validar as regras de tempo limite de deslocamento (ex: quantos minutos tolerar antes de alertar o admin).
- Escolher a tecnologia de mapas/geolocalização para o dashboard admin.
- Estimar o esforço de desenvolvimento do frontend e backend.
