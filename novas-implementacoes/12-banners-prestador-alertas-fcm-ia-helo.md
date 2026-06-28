# 12-banners-prestador-alertas-fcm-ia-helo.md

**Data:** 2026-06-27 a 2026-06-28
**Branch:** main
**Commits:** `46e4284` a `6782a3c`

## Resumo da sessão

### 1. Sistema de alerta de novos pedidos (FCM Push)

**Problema:** Prestador só ouvia alerta de novo pedido com o app aberto. Com app fechado, não tocava nada.

**Solução:**
- **Android:** `FirebaseMessagingService` agora dispara som contínuo + `AlertForegroundService` ao receber FCM de pedido
- **Backend Render:** novo `provider-notification.service.js` escuta Firestore por pedidos `distributing`/`pending` e envia FCM multicast para prestadores aprovados do nicho
- **Firebase:** coleção `fcm_tokens` para armazenar tokens FCM de cada usuário
- **Firebase Rules:** regras para `fcm_tokens`

**Fluxo:** Cliente cria pedido → Backend detecta → Envia FCM push → Celular do prestador APITA (mesmo com app fechado!) → Som contínuo até aceitar/rejeitar

**Arquivos:** `FirebaseNotificationManager.kt`, `provider-notification.service.js`, `FirebaseMessagingService.kt`, `server.js`, `firestore.rules`

### 2. Cashback compacto na Home do cliente

**Problema:** Card de cashback ocupava muito espaço vertical, forçando scroll para ver os serviços.

**Alterações:**
- Altura: 72dp → 56dp
- Margem inferior: 36dp → 12dp
- Ícone moeda: 44dp → 36dp
- Raio do card: 36dp → 28dp
- Texto saldo: 22sp → 18sp
- Alinhamento: centralizado → à esquerda
- Saudação margin: 20dp → 10dp
- Padding top conteúdo: 16dp → 8dp
- Título Categorias margin: 12dp → 8dp

**Arquivos:** `activity_client_home.xml`

### 3. Banners rotativos na Home do prestador

**Feature nova:** Carrossel de banners igual ao do cliente, agora também na Home do prestador.

**Android:**
- `ProviderBannerRepository.kt` — lê coleção `provider_banners` do Firestore
- `activity_provider_home.xml` — ViewPager2 + dots de navegação
- `ProviderHomeActivity.kt` — setupBannerCarousel, auto-scroll 4s, dots

**Painel Admin:**
- `dashboard_admin/app/api/provider-banners/route.ts` — CRUD completo (GET/POST/DELETE)
- Coleção Firestore: `provider_banners` (separada de `home_banners`)

**Firebase Rules:** `provider_banners` — leitura para qualquer usuário logado, escrita apenas via Admin SDK

### 4. Renomeação IA: Hello → Helô

Todos os textos visíveis da IA foram renomeados de "Hello" para "Helô":
- Barra inferior, chat, mensagens de erro
- Backend: system prompt e mensagens de erro

**Arquivos:** 12 arquivos alterados (XML, Kotlin, JS)
**Deploy Render:** feito (system prompt atualizado)

### 5. Ícone da IA refeito

Novo ícone `ic_assistant.xml`: balão de chat com estrela (substituiu a engrenagem feia).

### 6. Posição do Helô na barra inferior

Movido para depois do Perfil: Início | Serviços | Pedidos | Perfil | **Helô**

### 7. Correção da barra de navegação do sistema

**Problema:** Em dispositivos como Realme C73, a barra de navegação do Android sobrepunha o conteúdo do app em várias telas.

**Solução:**
- Criado `InsetsHelper.kt` (utilitário edge-to-edge)
- Adicionado `navigationBarColor` sólido no tema
- Aplicado em 5 activities críticas: AssistantChatActivity, OrderDetailsActivity, HomeActivity, CreateOrderActivity, ClientOrdersActivity

### Deploys realizados

| Serviço | O que | Status |
|---------|-------|--------|
| Firebase Rules | `fcm_tokens`, `provider_banners` | ✅ |
| Render Backend | provider-notification.service.js, Helô | ✅ |
| Vercel Dashboard | API `/api/provider-banners` | ✅ |
| GitHub (alvaro209890) | Todos os commits | ✅ |
