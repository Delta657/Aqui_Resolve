# 03 — Combos Promocionais

**Prioridade:** 🟡 Média · **Fase:** 2 · **Complexidade:** Média · **Status:** ✅ Concluído (2026-06-22)

> Implementado e **validado ao vivo no emulador** (Waydroid): a seção "🔥 Combos Promocionais"
> aparece na Home com os cards (foto, "de R$X por R$Y", badge "Economize R$Z"); tocar abre o detalhe
> com os serviços incluídos + preços + economia; "Adicionar combo ao carrinho" pede o endereço e
> joga todos os itens no carrinho. O desconto é **recalculado pelo `PromotionManager`** pelas
> categorias dos itens — provado: Combo Casa Nova (Elétrica + Caça-vazamentos + Ar condicionado)
> caiu no carrinho como "Combo Elétrica + Hidráulica + Instalações **-R$ 217,50 (15%)**", total
> **R$ 1232,50 == valor anunciado no combo**. Abre a Fase 2.

---

## 🎯 Objetivo

Criar a seção **"🔥 Combos Promocionais"** na Home: combos com foto, descrição, valor promocional
e economia (ex.: Combo Casa Nova, Combo Segurança, Combo Limpeza Completa). Cada combo agrupa
serviços/nichos e leva o cliente direto ao carrinho com o desconto aplicado.

---

## 🧩 Contexto atual (importante — já existe lógica de combo!)

- **`PromotionManager.kt`** já calcula desconto por combinação de categorias e por quantidade,
  lendo `CashbackManager.CashbackConfig` (de `app_config/cashback`). Combos como
  "Elétrica + Hidráulica" já existem como **regra de desconto** no carrinho.
- **`ClientCartActivity.kt`** já aplica o desconto via `PromotionManager.computeDiscount(...)` e
  exibe Subtotal/Desconto/Total + hint.
- **`CatalogServiceRepository.kt`** + `catalog_services` fornecem serviços (nicho, preço, comissão).
- **`FirebaseCartManager.prepareCheckout(..., discountPercent)`** já injeta o desconto em cada pedido.

> ⚠️ **Não reimplementar desconto.** Esta feature é a **vitrine** dos combos + o atalho de
> "adicionar combo ao carrinho". O cálculo do desconto continua no fluxo já existente.

---

## ✅ Escopo

**Entra:**
- ✅ Coleção `home_combos` (combos "curados" e exibíveis: foto, descrição, itens).
- ✅ Seção horizontal/vertical "🔥 Combos Promocionais" na Home.
- ✅ Tela/bottom-sheet de detalhe do combo (itens incluídos, valor cheio, valor promo, economia).
- ✅ Botão "Adicionar combo ao carrinho" → adiciona os serviços do combo ao carrinho.
- ✅ CRUD no painel (`/dashboard/servicos/combos`).

**Não entra (⛔):**
- ⛔ Nova engine de desconto (usa `PromotionManager`/`app_config/cashback`).
- ⛔ Combos dinâmicos por IA (futuro).

---

## 🗄 Modelo de dados — coleção `home_combos`

```jsonc
{
  "name": "Combo Casa Nova",
  "description": "Instalação elétrica + hidráulica + montagem de móveis",
  "imageUrl": "https://.../combo-casa-nova.jpg",
  "items": [                                  // serviços que compõem o combo
    { "niche": "Elétrica",  "serviceName": "Instalação de tomada", "serviceId": "eletrica__instalacao-de-tomada" },
    { "niche": "Encanador", "serviceName": "Instalação de torneira", "serviceId": "encanador__instalacao-de-torneira" }
  ],
  "fullPrice": 300.00,        // soma dos preços cheios (referência; pode ser calculado)
  "promoPrice": 255.00,       // valor promocional exibido (referência)
  "savings": 45.00,           // economia exibida (fullPrice - promoPrice)
  "discountPercent": 15,      // % aplicado (deve casar com a regra do PromotionManager/combo)
  "active": true,
  "displayOrder": 1,
  "createdAt": <serverTimestamp>,
  "updatedAt": <serverTimestamp>
}
```

> **Coerência de preço:** o valor **cobrado** continua vindo do fluxo carrinho→backend
> (`catalog_services` + `PromotionManager`). Os campos `fullPrice/promoPrice/savings` aqui são
> **de exibição/curadoria**; o painel deve calculá-los a partir de `catalog_services` para não
> divergir da cobrança real. Documentar esse ponto no painel (aviso visual se divergir).

### Regras Firestore

```
// Combos promocionais exibidos na Home — leitura autenticada; escrita só Admin SDK
match /home_combos/{comboId} {
  allow read: if isSignedIn();
  allow write: if false;
}
```

---

## 🖥 Painel admin

- **Página:** `dashboard_admin/app/dashboard/servicos/combos/page.tsx`
  - Form: nome, descrição, imagem (upload/URL), seleção de itens a partir de `catalog_services`
    (multi-select com busca), % do combo, ordem, ativo.
  - **Cálculo automático** de `fullPrice` (soma dos `estimatedPrice`), `promoPrice` e `savings`
    a partir do % — com aviso se o % não casar com nenhum combo do `app_config/cashback`.
- **API:** `dashboard_admin/app/api/combos/route.ts` (GET/POST/DELETE, Admin SDK).
- **Sidebar:** item em Serviços.

> **Integração com a regra de desconto:** idealmente o % do combo aqui deve corresponder a um combo
> reconhecido por `PromotionManager` (ex.: Elétrica+Hidráulica = 10%). Como o desconto real é
> recalculado no carrinho pelas categorias dos itens, o combo "vitrine" deve conter itens cujas
> categorias disparem o desconto esperado. **Validar no painel** (mostrar o % que o carrinho aplicará).

---

## 📱 App (camadas)

### 1. Model
`app/src/main/java/com/aquiresolve/app/models/HomeCombo.kt`
```kotlin
data class HomeComboItem(
    val niche: String = "",
    val serviceName: String = "",
    val serviceId: String = ""
)
data class HomeCombo(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val imageUrl: String = "",
    val items: List<HomeComboItem> = emptyList(),
    val fullPrice: Double = 0.0,
    val promoPrice: Double = 0.0,
    val savings: Double = 0.0,
    val discountPercent: Int = 0,
    val active: Boolean = true,
    val displayOrder: Int = 0
)
```

### 2. Repository
`app/src/main/java/com/aquiresolve/app/ComboRepository.kt` — `load()` lê `home_combos`,
filtra `active`, ordena por `displayOrder`, cacheia, fallback vazio (esconde seção).

### 3. Adapter + detalhe
- `adapters/HomeComboAdapter.kt` + `item_home_combo.xml` (card com foto, nome, "de R$X por R$Y",
  badge "economize R$Z").
- Detalhe: bottom-sheet ou `ComboDetailActivity` com lista de itens incluídos e botão "Adicionar ao carrinho".

### 4. Layout (Home)
Seção "🔥 Combos Promocionais" (título + `RecyclerView` horizontal) abaixo de Categorias.

### 5. Adicionar ao carrinho
- Ao confirmar o combo, adicionar cada `item` ao carrinho via o **mesmo caminho** que a criação de
  pedido/carrinho usa hoje (`FirebaseCartManager` / fluxo de `CreateOrderActivity` → carrinho).
- O desconto **não é forçado pelo combo**: ao cair no carrinho com as categorias certas,
  `PromotionManager.computeDiscount` aplica o % automaticamente (consistência garantida).
- Levar o cliente ao `ClientCartActivity` já com os itens.
- Analytics: `combo_add_cart` com nome do combo.

---

## 🎨 Design / UX

- Cards de combo maiores que categorias (~260dp largura): foto no topo, nome, preço com riscado
  (`fullPrice`) + preço promo destacado (`primary_color`), badge verde de economia (`secondary_color`).
- Emoji 🔥 no título da seção.
- Detalhe: lista clara dos serviços inclusos + total e economia + CTA grande.

---

## ✔️ Checklist

### Firestore / Regras
- [x] Bloco `home_combos` em `firestore.rules` (read se logado, write só Admin SDK) + publicado.
- [x] Bloco `combo_images` em `storage.rules` (upload ≤10MB pelo painel) + publicado.

### Painel admin
- [x] API `app/api/combos/route.ts` (GET/POST/DELETE, Admin SDK; recalcula promoPrice/savings no servidor).
- [x] Página `dashboard/servicos/combos/page.tsx` (form + multi-select de itens de `catalog_services` com busca + cálculo automático de fullPrice/promo/savings).
- [x] Aviso de coerência: prevê o % que o carrinho aplicará (replicando os grupos do `PromotionManager` + percentuais de `app_config/cashback`) e alerta verde/âmbar conforme casar com o % anunciado.
- [x] Item "Combos Promocionais" na sidebar (Serviços) + deploy.
- [x] Cadastrar combos de teste (script `scripts/seed-combos.mjs` — usa serviços reais e % reais).

### App
- [x] Models `HomeCombo`/`HomeComboItem`.
- [x] `ComboRepository.kt` (load/cache/fallback vazio, defensivo; pré-aquecido no `AppApplication`).
- [x] `HomeComboAdapter.kt` + `item_home_combo.xml` (card ~260dp: foto, preço riscado + promo, badge economia).
- [x] Seção `sectionCombos` na Home (título + RecyclerView horizontal, abaixo de Categorias; GONE se vazio).
- [x] `ComboDetailActivity` + `activity_combo_detail.xml` (itens incluídos + preços + resumo + CTA).
- [x] "Adicionar combo ao carrinho" usando o fluxo existente: pede endereço salvo → `FirebaseCartManager.addItem` por item.
- [x] `PromotionManager` aplica o desconto no carrinho automaticamente (pelas categorias dos itens).
- [x] Eventos Analytics `home_combo_click` e `combo_add_cart`.

### QA (validado no emulador Waydroid)
- [x] Combo aparece na Home; sem combos → seção some.
- [x] Detalhe mostra itens, preços e economia corretos (1450 = 150+550+750; -217,50; 1232,50).
- [x] Adicionar combo coloca todos os itens no carrinho (3/3, com o endereço escolhido).
- [x] Desconto do carrinho bate com o anunciado no combo (15% triplo, R$ 1232,50).
- [x] Preço cobrado = preço do catálogo/backend (combo é só vitrine; cobrança vem de `catalog_services`).
- [x] Sem endereço salvo → CTA leva a "Meus Endereços" (não trava).

---

## 🟢 Critérios de aceite

1. Admin cria um combo no painel; ele aparece na Home sem novo APK.
2. Adicionar o combo enche o carrinho e o desconto correto é aplicado pelo fluxo existente.
3. O valor anunciado no combo == valor efetivamente cobrado.

---

## ⚠️ Riscos & gotchas

- **Divergência de preço** é o maior risco: a fonte de verdade da cobrança é
  `catalog_services` + backend. Os campos de preço do combo são exibição → calculá-los **a partir**
  de `catalog_services` no painel, nunca digitar à mão.
- **% do combo x categorias:** o desconto real depende das categorias dos itens (regra do
  `PromotionManager`). Montar combos cujas categorias disparem o % anunciado.
- **Itens fora do catálogo:** se um `serviceId` não existir mais, tratar com fallback (ignorar item
  ou avisar) para não quebrar o carrinho.

---

## 📦 Estimativa

Média — ~1,5 a 2 dias (app) + ~1 dia (painel, por causa do cálculo/validação de preço).
</content>
