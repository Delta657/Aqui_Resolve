# Relatório de Teste E2E + Geração de APK — 2026-06-26

**App:** AquiResolve (cliente) · **versionName:** 1.2.8 · **versionCode:** 20260626
**APK:** `relatorio-testes-e2e/AquiResolve-v1.2.8-release.apk` (release assinado, R8 + shrinkResources, ~6,2 MB)
**Emulador:** Waydroid (Android 11), login como `cliente.teste@aquiresolve.com`.

## Resumo

Gerei o APK release atualizado, instalei no emulador e percorri o checklist completo do
fluxo do cliente. **O app está sólido — nenhum crash.** Encontrei e corrigi **1 bug real**
(formatação de moeda inconsistente, mostrava ponto em vez de vírgula em telas-chave, inclusive
no checkout). Rebuildei, reinstalei e revalidei a correção ao vivo.

## Checklist de testes (emulador, ao vivo)

| # | Tela / Fluxo | Resultado |
|---|---|---|
| 1 | Splash + abertura (`MainActivity`) | ✅ Sem crash; permissões concedidas |
| 2 | Login cliente | ✅ Autentica no Firebase → `ClientHomeActivity` |
| 3 | Home Premium (busca, carrossel, saudação, categorias, cashback, combos, parceiros) | ✅ Tudo renderiza (tema escuro) |
| 4 | **Banner de Parceiro → BottomSheet** (feature nova, commit `4fcf767`) | ✅ Abre sheet com nome/benefício/explicação + botões WhatsApp/Instagram |
| 5 | Botão WhatsApp do parceiro (WhatsApp ausente no emulador) | ✅ Gera URL `api.whatsapp.com/send?...` e faz **fallback p/ navegador** sem crash |
| 6 | Categoria **Guincho** → `TowingOrderActivity` | ✅ Fluxo dedicado (origem/destino/taxa) carrega |
| 7 | Categoria **Elétrica** → `CreateOrderActivity` | ✅ Form (tipo de serviço, endereço, descrição, anexar imagem) |
| 8 | Dropdown "Tipo de Serviço" (catálogo dinâmico `catalog_services`) | ✅ 9 serviços de Elétrica com preços (Instalação de lâmpadas R$110, Troca de disjuntor R$150, …) |
| 9 | **Assistente IA** (`AssistantChatActivity`, redesign commit `2238548`) | ✅ Abre chat; chips de sugestão; envio |
| 10 | IA responde (backend Groq) | ✅ Multi-turno e contextual: "…você precisa de um encanador para consertar a torneira vazando…" |
| 11 | Meus Pedidos (`ClientOrdersActivity`) | ✅ Abas + estatísticas + card do pedido de teste |
| 12 | Detalhes do Pedido (`OrderDetailsActivity`) | ✅ Orçamento, descrição, endereço, distância, prestador |
| 13 | Perfil (`ProfileActivity`) | ✅ Todas as seções (cashback, endereços, aparência, sair) |
| 14 | Notificações (`NotificationHistoryActivity`) | ✅ Empty state correto |
| 15 | Central AquiResolve (`ClientCentralChatActivity`) | ✅ Empty state correto |
| 16 | Carrinho (`ClientCartActivity`) | ✅ Abre; total/itens — **bug de formatação encontrado aqui (ver abaixo)** |

## Bug encontrado e corrigido

### 🐛 Moeda formatada com ponto em vez de vírgula (pt-BR)

- **Sintoma:** o carrinho exibia o total como **`R$ 0.00`** (ponto), divergindo do resto do
  app, que usa o padrão brasileiro **`R$ 0,00`** (vírgula) — visto, p.ex., no card de cashback
  (`R$ 0,00`), catálogo (`R$ 110,00`) e combos (`R$ 1232,50`).
- **Causa raiz:** uso de `String.format("R$ %.2f", valor)` **sem `Locale`**. Sem locale
  explícito, o Android usa o locale padrão do dispositivo, que formata com ponto. O restante do
  app já usava `String.format(Locale("pt", "BR"), …)`.
- **Impacto:** cosmético, mas aparecia no **carrinho e em todo o fluxo de checkout** (valor do
  pedido, cashback aplicado, valor final, PIX e comprovante) — telas onde a inconsistência é
  mais visível e passa impressão de descuido.
- **Correção:** adicionei `Locale("pt", "BR")` a todas as formatações de moeda afetadas
  (12 ocorrências em 6 arquivos):
  - `ClientCartActivity.kt` (total, subtotal, desconto)
  - `adapters/CartItemsAdapter.kt` (preço do item)
  - `PaymentActivity.kt` (cashback disponível, desconto, valor final, valor do pedido, diálogo de confirmação)
  - `PixPaymentActivity.kt` (valor do pedido)
  - `PaymentConfirmationActivity.kt` (valor + comprovante compartilhado)
  - `ProviderProfileFragment.kt`, `ProviderOrdersFragment.kt`, `adapters/ProviderOrdersAdapter.kt` (lado prestador, mesma inconsistência)
- **Validação:** rebuildei o APK, reinstalei e reabri o carrinho → agora exibe **`R$ 0,00`**. ✅

## Itens verificados que NÃO são bug

- **`Pedido #RDER_001`** na lista de pedidos: é `order.id.takeLast(8).uppercase()` —
  truncamento **intencional** para encurtar o ID. Para IDs reais do Firestore (20 chars
  aleatórios) fica natural; só pareceu estranho no ID de teste `ORDER_001`. Mantido.
- **`Distância: 2106.1 km`** no pedido de teste: é dado do pedido de teste (coords distantes da
  localização simulada do emulador), não bug.

## Observação de ambiente (não é bug do app)

Ao digitar via `adb input`, caracteres extras podem cair nos campos quando o toque acerta o
teclado virtual do Waydroid — artefato do emulador, **não do app**. Contornado digitando com
`%s` para espaços e submetendo via tecla/IME.

## Artefato

- **APK funcionando:** `/home/acer/Documentos/Aqui_Resolve/relatorio-testes-e2e/AquiResolve-v1.2.8-release.apk`
  (também em `app/build/outputs/apk/release/app-release.apk`).
