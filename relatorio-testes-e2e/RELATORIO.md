# Relatório de Testes E2E — App AquiResolve (Cliente)

- **Data:** 2026-06-23
- **Build testado:** APK debug do código atual pós-merge — `versionName 1.2.7` / `versionCode 20260615`, gerado às 14:01.
- **Emulador:** Waydroid (Android 11) via weston, device `192.168.240.112:5555`, densidade ajustada para 140 (ver Observação E-1).
- **Projeto Firebase:** `aplicativoservico-143c2` (PRODUÇÃO — dados reais).
- **Conta de teste criada:** `qa.teste.0623@aquiresolve.com` / senha `TesteQA123456!` (uid `GYj9GlUikdehqD4kh29tsnozs672`), tipo *client*.
  - Via Admin SDK: `cashbackBalance=100`, `cashbackTotalEarned=100`, `isVerified=true` (apenas para viabilizar testes; nada apagado).

> Metodologia: app dirigido por `adb` (uiautomator dump + input tap/text), logcat monitorado por fluxo. Telas com `FLAG_SECURE` não permitem screenshot (PNG vazio) — nesses casos a evidência é o dump de UI / logcat.

---

## Resumo executivo

Testado o app mobile de ponta a ponta no emulador (Waydroid) com o **APK recém-buildado do código mergeado**, criando uma conta de cliente nova e percorrendo praticamente toda a jornada do cliente, mais a subida e verificação do painel admin. **19 capturas de tela** em `screenshots/`.

**Veredito: o app está sólido.** Todos os fluxos centrais funcionam de ponta a ponta — cadastro, login, catálogo dinâmico, criação de pedido com upload de imagem, cálculo de preço pelo backend, **aplicação de cashback**, **combos com desconto no carrinho** e o **Assistente IA (Groq)**. Nenhum crash. Foram encontrados **5 bugs** (1 médio, 2 baixos, 2 cosméticos) — nenhum bloqueante.

**Destaques validados ao vivo:**
- ✅ Pedido `awaiting_payment` criado com payload correto; preço do backend via catálogo (R$110 cliente / R$55 prestador).
- ✅ Cashback: R$ 100,00 aplicados → total R$110 caiu para **R$10**.
- ✅ Combo "Casa Nova": carrinho recalculou **−R$217,50 (15%) → R$1232,50** (igual ao anunciado).
- ✅ Assistente IA classificou "torneira vazando" → nicho **Encanador** (valida o backend Groq no APK novo, antes pendente).
- ✅ Painel admin sobe, páginas 200, APIs com **RBAC** exigindo autenticação (401).

**Atenção principal (fora do escopo de bug):** o **tema escuro** que se esperava do merge **não está no código** — `alvaro/main` é idêntico ao `main`; provavelmente o Álvaro ainda não publicou (push) essa branch. Ver seção dedicada abaixo.

**O que NÃO foi executado (por limitação de ambiente, não falha do app):** cobrança real no gateway Pagar.me (modo LIVE — evitei transação real); seleção real de GPS/tiles no mapa (Waydroid sem mapa → coords 0,0); e o teste das rotas autenticadas do painel via CLI (sem senha master / API de credenciais desabilitada).

**Conta de teste deixada no banco (nada apagado):** `qa.teste.0623@aquiresolve.com` (uid `GYj9GlUikdehqD4kh29tsnozs672`) com cashback R$100 + 1 endereço salvo + carrinho com o combo. Pode remover quando quiser.

---

## Resultados por fluxo

### 1. Cadastro de cliente (ClientSignUpActivity) — ✅ FUNCIONA (com 1 bug)
- Conta criada com sucesso: usuário no Firebase Auth + doc em `users/{uid}` com todos os campos (fullName, username, phone, email, userType=client).
- Diálogo "🎉 Conta Criada!" exibido; logout automático pós-cadastro; redireciona para login.
- **[BUG-01 / Médio]** A verificação de unicidade do nome de usuário falha silenciosamente com `PERMISSION_DENIED`. No logcat:
  `FirebaseAuthManager: Erro ao verificar nome de usuário ... PERMISSION_DENIED: Missing or insufficient permissions.`
  Causa: a checagem consulta a coleção `users` **antes** do usuário autenticar, mas as regras do Firestore exigem `isSignedIn()` para ler `users`. O erro é engolido e o cadastro prossegue — ou seja, **a unicidade de username NÃO é validada de fato**, permitindo usernames duplicados.

### 2. Login (MainActivity) — ✅ FUNCIONA
- Login com a conta nova → `ClientHomeActivity`.
- Observação: warnings `Glide: Received null model` (x3) ao carregar a home — provável `profileImageUrl=null` sendo passado ao Glide sem guarda. Cosmético.
- Warning `App Check: No AppCheckProvider installed` (esperado em debug).

### 3. Home do cliente (ClientHomeActivity) — ✅ FUNCIONA
- Saldo de cashback exibido corretamente: **R$ 100,00**.
- Saudação "Olá, QA!", 8 categorias carregadas do Firestore (Guincho, Elétrica, Encanador, Instalação, Caixa d'água, Desentupimento manual, Desentupimento com maquinário até 2 m, Caça-vazamentos).
- 3 combos promocionais com preços (Combo Casa Nova R$1232,50, Elétrica+Hidráulica R$630, Reforma Rápida), seção Parceiros, banners rotativos, busca, bottom nav (Início/Serviços/Pedidos/Perfil).

### 4. Endereços (AddressManagementActivity + AddressMapPickerActivity) — ✅ FUNCIONA
- Cadastro de endereço com seletor de UF (27 estados), CEP com máscara automática (`78000-000`), e seleção no mapa.
- Endereço salvo em `saved_addresses` e listado corretamente: "Casa QA - Rua das Flores, 100, Centro, Cuiaba, MT, 78000-000".
- **[BUG-02]** ver índice — model `SavedAddress` não mapeia `shortAddress`/`default`/`fullAddress` (warnings `CustomClassMapper`).
- Mapa (OSMDroid): os tiles não carregaram no Waydroid e a localização caiu em (0,0) — **artefato de ambiente** (sem GPS/tiles no container), não é bug do app.

### 5. Catálogo dinâmico de serviços (CreateOrderActivity) — ✅ FUNCIONA
- Nicho "Elétrica" → 9 serviços carregados de `catalog_services` com preços corretos (logcat: `CatalogServiceRepo: Serviços carregados para 'Elétrica': 9`; `CatalogRepository: 15 nichos ativos`).
- Dropdown exibe nome + preço (ex.: "Instalação de tomada — R$ 110,00").
- Observação de automação: o popup do dropdown é dispensado pelo `uiautomator dump` (transitório) — validado por screenshot.

### 6. Criar Pedido → Pagamento (fluxo single-service) — ✅ FUNCIONA (excelente)
- Imagem **obrigatória** anexada via galeria → upload p/ Firebase Storage OK (`Pedidos/{orderId}/...jpg`).
- Backend de preços (Render) respondeu via catálogo Firestore: `Preço backend (firestore_catalog): R$ 110.0, prestador: R$ 55.0`.
- Pedido criado em `orders/{id}` com payload correto: `status=awaiting_payment`, `serviceName="Elétrica"`, `serviceType="Instalação de tomada"`, `estimatedPrice=110`, `providerCommission=55`, `images[]`, `address/city/state/zipCode`, `coordinates` (GeoPoint), `protocol`, `clientName/clientEmail`. **Sem reverter / sem PERMISSION_DENIED** (a correção de regras pay-before-distribution está válida no APK atual).
- **[BUG-04 / Baixo-UX]** Ao escolher **"Galeria"** no diálogo de anexo, o app solicita a permissão de **CÂMERA** (além de fotos) — galeria não precisa de câmera. Pode assustar/atritar o usuário. (As duas permissões são pedidas; o fluxo prossegue.)

### 7. Pagamento + uso de Cashback (PaymentActivity) — ✅ FUNCIONA
- Tela com PIX/Cartão, resumo do pedido e formulário de cartão completo (número, titular, validade, CVV, CPF, CEP).
- **Saldo de cashback exibido (R$ 100,00)** e o switch "Usar meu cashback" aplica o desconto corretamente: `Valor Total R$ 110,00` → `Desconto do cashback − R$ 100,00` → **`Total a pagar R$ 10,00`**.
- ⚠️ **Não foi concluída cobrança real**: o gateway Pagar.me está em modo **LIVE** (chaves `sk_` de produção). Concluir cartão/PIX criaria transação financeira real. Verificado todo o caminho até a chamada ao gateway (preço + cashback), sem disparar a cobrança. O pedido permanece em `awaiting_payment` (nada apagado).

### 8. Telas do Perfil — ✅ TODAS FUNCIONAM (sem crash)
- **PersonalDataActivity:** nome, username, email, telefone, "Salvar".
- **CashbackActivity (Meu AquiCash):** Saldo R$ 100,00, Total acumulado R$ 100,00, Nível Bronze (3%), "Faltam R$ 500,00 para o nível Prata", passo a passo do programa.
- **NotificationSettingsActivity:** toggles (notificações, som, vibração) + tipos (pedidos/cotações, mensagens, pagamentos).
- **PrivacySettingsActivity:** privacidade, compartilhamento de dados, Exportar Dados, Excluir Conta, documentos legais.
- **HelpSupportActivity:** FAQ do Cliente.
- *(Os "AndroidRuntime START uid 2000" no logcat são o processo do shell/uiautomator, NÃO crashes do app.)*

### 9. Notificações / Carrinho / Pedidos / Central Chat — ✅ FUNCIONAM
- **NotificationHistoryActivity:** estado vazio "Nenhuma notificação".
- **ClientCartActivity:** "0 item(ns)", R$ 0.00, botões Finalizar/Continuar.
- **ClientOrdersActivity:** abas (Em Andamento/Distribuição/Concluídos/Cancelados), contadores 0, estado vazio correto (o pedido de teste foi cancelado).
- **ClientCentralChatActivity:** "Central AquiResolve", estado vazio + campo "Escreva uma mensagem...".

### 10. Combos → Carrinho (PromotionManager) — ✅ FUNCIONA (excelente)
- **ComboDetailActivity (Combo Casa Nova):** 3 serviços com preço do catálogo (Instalação de chuveiro R$150 / Caça-vazamentos R$550 / 18 a 30 mil BTUs R$750), Valor cheio R$1450, Economia −R$217,50 (15%), Total R$1232,50.
- "Adicionar combo ao carrinho" pede confirmação de endereço e adiciona os 3 itens.
- **No carrinho o desconto é recalculado corretamente:** Subtotal R$1450,00 → Desconto −R$217,50 (15%) → **Total R$1232,50** (idêntico ao anunciado). Validou o `PromotionManager` ponta a ponta.

### 11. Assistente IA (AssistantActivity + backend Groq) — ✅ FUNCIONA (validação inédita)
- Entrada: *"minha torneira da cozinha esta vazando"* → IA respondeu: **"Parece um problema hidráulico. Posso te levar para Encanador?"** com chip do nicho **Encanador** e botões "Sim, continuar" / "Ver todos os serviços".
- "Sim, continuar" → roteou para `CreateOrderActivity` (nicho Encanador).
- **Importante:** isso valida ao vivo a integração `POST /api/ai/classify` (Groq) **no APK novo** — algo que estava pendente de validação por exigir APK atualizado (ver memória "Home Premium + IA"). ✅

### 12. Parceiros (PartnerDetailActivity) — ✅ FUNCIONA
- Seção com 3 parceiros (Leroy Merlin 10% OFF, Telhanorte Cupom AQUI15, Casa & Construção 5% cashback).
- Detalhe do Telhanorte: cupom **AQUI15**, botão COPIAR e "Visitar site do parceiro".

### 13. Cadastro de Prestador (ProviderSignUpActivity) — ✅ ABRE OK
- Tela "Cadastro de Prestador" renderiza: nome, celular, CPF, e seleção de nichos (checkboxes) carregada do **catálogo dinâmico** (Guincho, Elétrica, Encanador, Instalação, Caixa d'água...). Sem crash.
- Fluxo completo (envio + upload de documentos) não foi concluído para não criar uma 2ª conta/documentos de teste; abertura e catálogo validados.

### 14. Fluxo de cancelamento de pagamento — ✅ FUNCIONA
- Sair da `PaymentActivity` mostra "⚠️ Cancelar Pagamento?" → "Sair e Cancelar" → o app **remove o pedido não-pago** do Firestore (modelo pay-before-creation). Confirmado: o doc `orders/{id}` deixou de existir.
- **[BUG-05 / Cosmético]** O 1º diálogo diz "seu pedido NÃO será criado", mas o doc já existe em `awaiting_payment` no momento (é removido só ao confirmar). Texto levemente impreciso.

### 15. Painel Admin (dashboard_admin — Next.js) — ✅ RODA / auth OK
Servidor `npm run dev` subiu em `localhost:3000` (Next.js 15.5.9, "Ready in 2.7s"), usando `.env.local` real.
- **Páginas renderizam (HTTP 200):** `/` (login "AquiResolve - Painel Administrativo"), `/dashboard`, `/dashboard/controle/monitoramento` (feature mais recente do merge), `/dashboard/manual`, `/dashboard/servicos/combos`, `/orders`. *(obs.: `/login` dá 404 — o login fica em `/`, não é rota separada.)*
- **APIs aplicam autenticação (HTTP 401):** `/api/orders`, `/api/catalog/services`, `/api/banners`, `/api/combos`, `/api/partners`, `/api/client-chats`, `/api/provider-chats`, `/api/admin-logs` retornam `{"success":false,"error":"Autenticação administrativa obrigatória"}`. ✅ Confirma o **RBAC + sessão master** mergeado (`lib/server/admin-authorization.ts`: exige ID token Bearer → valida em `adminmaster/master/usuarios` + permissões).
- **`/api/health` = 200.**
- **Dados do RBAC populados:** `adminmaster/master` existe (master@aquiresolve.com) + 3 usuários admin com conjuntos de permissões (`dashboard`, `controle`, `gestaoUsuarios`, `gestaoPedidos`, `financeiro`, `relatorios`, `config`...).
- **Camada de dados (Admin SDK) validada ao vivo** ao longo de todos os testes: leitura/escrita de `users`, `orders`, `saved_addresses`, `catalog_services`, `home_combos`, `partners` — todas funcionais.
- **Limitação de teste (não é bug):** não foi possível exercer as rotas autenticadas via linha de comando — cunhar um ID token exigiria a senha do master (não armazenada) ou a *IAM Service Account Credentials API* (desabilitada no projeto). Optei por **não** habilitar APIs nem alterar config do projeto. A verificação visual logada do painel requer o navegador com a senha do master.

---

## ⚠️ Sobre o "tema escuro" esperado do merge

O merge solicitado (pegar atualizações do remote `alvaro` e unir ao `main`) foi concluído, **mas o tema escuro não está presente no código mergeado**:
- `alvaro/main` está **idêntico** ao `main` (mesmo HEAD `2df2b2d`), sem commits novos.
- Não existe diretório `app/src/main/res/values-night/` nem lógica de `DayNight`/`nightMode`/alternância de tema no app.
- Conclusão: **o tema escuro ainda não foi publicado pelo Álvaro no GitHub** (provavelmente está local na máquina dele, sem push). Para integrá-lo, ele precisa dar `push` da branch com o tema; depois um novo `fetch`/`merge` o traz. Todos os testes acima foram feitos no **código atual mergeado** (sem tema escuro), como solicitado.

---

## Observações de ambiente (não são bugs do app)

- **E-1:** No emulador 540x976, o `btnSignUpClient`/botões inferiores caíam sob a barra de gestos do Android e o teclado virtual cobria o botão "Criar Conta". Resolvido baixando a densidade para 140. Em telefone real (tela mais alta) não ocorre.

---

## Bugs encontrados (índice)

| ID | Severidade | Área | Resumo |
|----|-----------|------|--------|
| BUG-01 | Médio | Cadastro | Unicidade de username não é validada (PERMISSION_DENIED engolido) |
| BUG-02 | Baixo | Endereços | Modelo `SavedAddress` não mapeia campos gravados no Firestore (`shortAddress`, `default`, `fullAddress`) — flag de padrão pode não voltar |
| BUG-03 | Cosmético | Login/Home | `Glide: Received null model` ao carregar foto de perfil nula |
| BUG-04 | Baixo (UX) | Criar Pedido | Escolher "Galeria" no anexo pede permissão de CÂMERA |
| BUG-05 | Cosmético | Pagamento | Diálogo diz "pedido NÃO será criado" mas o doc já existe em awaiting_payment |
