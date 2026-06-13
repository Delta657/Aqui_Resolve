# Testes para Fazer — AquiResolve

Este documento lista testes manuais e automatizados que devem ser executados antes de qualquer release.

---

## Testes manuais críticos (fazer sempre antes de um commit importante)

### App Android — fluxo do cliente

1. **Login / cadastro de cliente**
   - Criar conta nova → verificar documento criado em `users/{uid}` no Firestore Console
   - Login com conta existente → tela ClientHomeActivity carrega

2. **Fazer pedido + pagar com PIX**
   - Selecionar serviço → preencher endereço → ir para pagamento → gerar QR PIX
   - Simular pagamento PIX no ambiente sandbox do Pagar.me
   - Verificar que `paymentStatus` muda para `paid` e `status` muda para `pending`

3. **Ver cashback na home**
   - Após pedido concluído, card de cashback deve exibir saldo atualizado (não zero)
   - Clicar no card → abre `CashbackActivity` com extrato

4. **Histórico de notificações**
   - Pressionar botão de notificações → `NotificationHistoryActivity` abre
   - Notificações marcadas como lidas ao abrir a tela

---

### App Android — fluxo do prestador

5. **Login de prestador + verificação**
   - Cadastro de prestador → status `pending` → banner de verificação aparece
   - Após aprovação pelo admin: banner some

6. **Aceitar pedido**
   - Pedido em `distributing` → prestador vê na lista → aceita
   - `status` muda para `assigned` em tempo real no app do cliente

7. **Preencher checklist**
   - Prestador marca início do serviço (`in_progress`)
   - Navega para checklist: preenche todos os campos
   - **Verificar campos novos:** avarias pré-existentes (texto), seleção de resolução (3 opções), checkbox de declaração
   - Sem selecionar a resolução → botão "Próximo" bloqueado (toast aparece)
   - Sem marcar declaração → botão "Próximo" bloqueado (toast aparece)

8. **Fotos de evidência**
   - Tirar/selecionar pelo menos 1 foto de cada categoria (antes/durante/depois)
   - Fotos sobem para Firebase Storage
   - URLs salvas em `checklists/{orderId}.photosBefore/During/After`

9. **Assinaturas digitais**
   - Prestador assina → imagem salva no Storage + URL em `providerSignatureUrl`
   - Cliente assina → URL em `clientSignatureUrl`

10. **Financeiro do prestador**
    - Após pedido concluído: `ProviderFinancialActivity` mostra saldo atualizado
    - `providerBalance` incrementado no Firestore (`providers/{uid}`)

---

### Painel Admin

11. **Login admin**
    - `master@aquiresolve.com` faz login → dashboard carrega

12. **Listar pedidos**
    - `/dashboard/servicos/visualizar` → pedidos aparecem com dados reais
    - Filtrar por status → funciona
    - Buscar por cliente → funciona
    - Exportar CSV → arquivo baixado com dados corretos

13. **Ver OS completa**
    - Clicar em "Ver OS" em um pedido concluído
    - GPS, checklist (incluindo avarias, resolução, declaração), fotos e assinaturas aparecem

14. **Redirecionar pedido**
    - Pedido `assigned` ou `in_progress` → clicar no ícone de redirecionamento
    - Lista de prestadores aprovados carrega no select
    - Redirecionar para prestador específico → `assignedProvider` atualizado

15. **Cancelar pedido**
    - Pedido não concluído → cancelar com motivo
    - `status = cancelled` + push enviado para cliente e prestador

16. **Verificar prestador**
    - `/dashboard/controle/aceitacao-prestadores` → lista de prestadores pendentes
    - Aprovar → `verificationStatus = approved` no Firestore
    - Rejeitar com motivo → `verificationStatus = rejected` + `rejectionReason` salvo

17. **Enviar notificação**
    - `/dashboard/controle/notificacoes` → enviar para "Todos clientes"
    - Verificar que push chega no app E que documento é criado em `notifications/`

18. **Bloquear usuário**
    - Bloquear permanente → `isBlocked = true`, `blockType = permanent`
    - Bloquear temporário com data → `blockType = temporary`, `blockedUntil` salvo
    - Desbloquear → campos limpos

19. **Configurar cashback**
    - `/dashboard/configuracoes/aquicash` → alterar percentual do tier Bronze
    - Salvar → verificar `app_config/cashback` atualizado no Firestore Console
    - Completar um pedido → cashback calculado com o percentual novo

20. **Logs de auditoria**
    - `/dashboard/controle/logs` → ações de bloquear/desbloquear/verificar aparecem
    - Filtrar por tipo → funciona

---

### Backend

21. **Health check**
    ```bash
    curl https://aquiresolve.onrender.com/api/health
    # esperado: {"status":"ok"}
    ```

22. **Cálculo de preço**
    ```bash
    curl -X POST https://aquiresolve.onrender.com/api/payments/pricing/calculate \
      -H "Content-Type: application/json" \
      -d '{"serviceType":"Elétrico","address":"Rua Teste, 123"}'
    ```

23. **Verificar que backend não crasha sem credenciais Firebase**
    - Health check deve retornar 200 mesmo sem `FIREBASE_PRIVATE_KEY` no Render

---

## Testes automatizados recomendados (ainda não existem — implementar)

### Firebase Emulator — regras Firestore

Instalar o Firebase Emulator Suite e criar testes para verificar:

```bash
cd /home/acer/Documentos/app
firebase emulators:start --only firestore
```

Testes a criar (`firestore.test.js` com @firebase/rules-unit-testing):

1. Cliente pode criar pedido com campos obrigatórios → `allow`
2. Cliente NÃO pode criar pedido com `clientId` diferente do uid → `deny`
3. Cliente NÃO pode alterar `estimatedPrice` no update → `deny`
4. Prestador pode aceitar pedido em `distributing` → `allow`
5. Prestador NÃO pode aceitar pedido já `assigned` → `deny`
6. Ninguém pode escrever em `cashback_transactions` via client SDK → `deny`
7. Ninguém pode escrever em `adminLogs` via client SDK → `deny`
8. Ninguém pode criar notificações via client SDK → `deny`
9. Usuário pode marcar própria notificação como lida → `allow`
10. Usuário NÃO pode ler notificação de outro usuário → `deny`

### Backend — testes unitários (Jest)

```bash
cd /home/acer/Documentos/app/backend
npm install --save-dev jest supertest
```

Testes a criar:
1. `GET /api/health` retorna 200
2. `POST /api/payments/pricing/calculate` com body válido retorna preço
3. `POST /api/payments/card` sem body retorna 400
4. `POST /api/payments/pix` com dados inválidos retorna erro Pagar.me

---

## Comandos úteis de diagnóstico

```bash
# Ver últimos commits
git log --oneline -10

# Verificar build do app (sem instalar)
cd /home/acer/Documentos/app
./gradlew assembleDebug 2>&1 | tail -20

# Verificar build do painel admin
cd /home/acer/Documentos/app/dashboard_admin
npm run build 2>&1 | tail -30

# Testar backend localmente
cd /home/acer/Documentos/app/backend
npm start
curl http://localhost:3000/api/health

# Deploy das regras Firestore
firebase deploy --only firestore:rules,firestore:indexes
```
