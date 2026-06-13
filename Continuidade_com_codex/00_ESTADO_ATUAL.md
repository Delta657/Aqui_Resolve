# AquiResolve — Estado Atual do Projeto (12/06/2026)

## O que é o AquiResolve

Marketplace de serviços domésticos/profissionais. Cliente solicita um serviço (elétrica, encanamento etc.), paga, um prestador aceita e executa. O app gera uma OS (Ordem de Serviço) com checklist, fotos e assinaturas digitais.

## Três componentes

| Componente | Stack | Local | Deploy |
|---|---|---|---|
| App Android | Kotlin, Firebase SDK, Retrofit | `app/` | Google Play Store (ainda não publicado) |
| Painel Admin | Next.js 15, TypeScript, Firebase Admin SDK | `dashboard_admin/` | Vercel (auto-deploy no push em `main`) |
| Backend Pagamentos | Node.js/Express | `backend/` | Render.com (`aquiresolve.onrender.com`) |

**Firebase project:** `aplicativoservico-143c2`  
**Repositório GitHub:** `https://github.com/alvaro209890/AquiResolve`  
**Git flow:** commit direto em `main` (sem PR). Push em `main` → deploy automático Vercel.

---

## O que foi implementado até hoje

### App Android
- [x] Autenticação Firebase (cliente + prestador)
- [x] Fluxo completo de pedido: criação → pagamento PIX/cartão → distribuição → aceite → execução → conclusão
- [x] Checklist OS completo: chegada, execução, avarias pré-existentes, resolução do problema (3 opções), declaração de concordância
- [x] Fotos de evidência (antes/durante/depois) com upload para Firebase Storage
- [x] Assinaturas digitais (prestador + cliente) via `SignaturePad`
- [x] GPS do prestador ao iniciar serviço
- [x] Histórico de notificações (lê coleção `notifications` do Firestore)
- [x] Cashback card na home do cliente (mostra saldo `cashbackBalance`)
- [x] Tela Financeiro do Prestador (`ProviderFinancialActivity`)
- [x] Tela Status de Verificação do Prestador (`ProviderVerificationStatusActivity`)
- [x] Chat em tempo real (cliente ↔ prestador)
- [x] Rastreamento GPS do prestador em tempo real
- [x] Carrinho de serviços
- [x] Programa AquiCash (cashback)
- [x] LGPD / privacidade

### Painel Admin (Next.js)
- [x] Login admin via Firebase Auth
- [x] Dashboard com KPIs (pedidos, receita, prestadores)
- [x] Listagem de pedidos com filtros, paginação, export CSV
- [x] Visualização de OS completa (checklist, fotos, assinaturas)
- [x] Redirecionar pedido (para pool ou prestador específico)
- [x] Cancelar pedido
- [x] Gestão de usuários (bloquear/desbloquear, bloquear temporário ou permanente)
- [x] Verificação de prestadores (aprovar/rejeitar)
- [x] Envio de notificações FCM (por uid, todos clientes, todos prestadores, todos)
- [x] Logs de auditoria (`adminLogs`)
- [x] Configuração AquiCash (fases, tiers, combos)
- [x] Mapa ao vivo com GPS dos prestadores
- [x] Relatórios financeiros

### Backend (Node.js/Render)
- [x] Pagamento cartão via Pagar.me v5
- [x] Pagamento PIX via Pagar.me v5
- [x] Cálculo de preço
- [x] Status do pagamento
- [x] Keep-alive embutido (evita cold start no Render)
- [x] Resiliente sem credenciais (não crasha, retorna 503 nos endpoints de pagamento)

### Firebase
- [x] Regras Firestore completas e seguras
- [x] Regras Storage
- [x] Índices Firestore (adminLogs, notifications)
- [x] Auto-notificação FCM + persistência no Firestore ao mudar status do pedido
- [x] Cashback creditado automaticamente ao concluir pedido (Admin SDK no painel)
