# 00 — Roadmap & Prioridades

> **DIRETRIZ ESTRATÉGICA ATUAL:**
> "O foco agora é criar uma **Home Premium** com organização visual impecável. O cliente precisa encontrar e contratar um serviço em menos de 30 segundos. **Experiência do Usuário (UX) primeiro, Inteligência Artificial (IA) depois.** Isso gera conversão imediata."
> *(Nota à IA desenvolvedora: Embora ferramentas como Flutter tenham sido cogitadas, o desenvolvimento continua no **Android/Kotlin nativo** atual. Use os conceitos para enriquecer a UX nativa).*

---

## 🪜 Fases

### Fase 1 — Fundamentos visuais da Home (Entrega rápida, alto impacto)
Foco: o cliente bate o olho e em segundos sabe o que fazer. (UX fluida, acesso rápido).

1. 🟡 **Categorias horizontais** (`02`) — nichos em scroll lateral (ex: ⚡ Elétrica, 🚿 Hidráulica, 🛋 Limpeza).
2. 🟡 **Banner rotativo** (`01`) — topo da Home (Cashback, Promoções, Combos, Parceiros).
3. 🟡 **Busca inteligente** (`05`) — sugestões instantâneas ao digitar → contratação em 1 toque.

> Ao final da Fase 1 a Home já parece "premium" e a conversão tende a subir, **sem IA**.

### Fase 2 — Monetização e parcerias (Conteúdo gerenciável)
4. 🟡 **Combos promocionais** (`03`) — nova seção (ex: Combo Casa Nova, Segurança, Limpeza).
5. 🟡 **Parceiros AquiResolve** (`04`) — empresas patrocinadoras (ex: Leroy Merlin, Telhanorte) com descontos/cupons.

### Fase 3 — Inteligência (conveniência)
6. **Assistente IA Groq** (`06`) — app cliente: descreve o problema → IA identifica o nicho e direciona.
8. **Copiloto IA do Painel Admin** (`08`) — web, dentro da aba Manual: admin pergunta "como faço X?"
   → IA responde passo a passo (onde clicar). Trilha **do painel**, paralela ao app — pode ir em paralelo.

### Fase 4 — Fechamento (O Foco Atual)
7. 🟡 **Home Premium — montagem** (`07`) — **Onde o esforço principal deve se concentrar agora.** Integrar todas as seções, ajustar ordem/scroll/estados para criar uma vitrine premium (Banner, Cashback, Categorias, Combos, Parceiros, Pedidos recentes, Busca). O visual e a usabilidade devem ser perfeitos.

---

## 🔗 Dependências entre features

```
Categorias horizontais ──┐
                         ├──► Home Premium (montagem 07)
Banner rotativo ─────────┤
Busca inteligente ───────┤
Combos promocionais ─────┤        (Combos depende de PromotionManager/app_config já existentes)
Parceiros ───────────────┤
Assistente IA ───────────┘        (IA depende de proxy no backend Render + CatalogRepository)
```

- **Categorias** e **Busca** consomem o mesmo catálogo (`CatalogRepository` + `catalog_services`) — fazer juntas economiza esforço.
- **Combos** reusa `PromotionManager` + `CashbackManager.CashbackConfig` (`app_config/cashback`); a seção visual é nova, a regra de desconto **não muda**.
- **IA** precisa do **endpoint proxy no backend** antes da tela do app (não embutir a chave Groq no APK).
- **Montagem (07)** só fecha depois das seções existirem (mas pode começar com placeholders).

---

## 📊 Métricas de sucesso (o que observar)

| Métrica | Antes (baseline) | Meta |
|---------|------------------|------|
| Tempo até iniciar um pedido (abrir app → tela de criar pedido) | medir | < 30s |
| % de sessões que tocam em uma categoria/banner | medir | ↑ |
| Taxa de uso da busca | medir | ↑ |
| Combos adicionados ao carrinho | 0 | > 0 |
| Cliques em parceiros | 0 | > 0 |
| Uso do assistente IA (quando lançado) | 0 | acompanhar |

> Instrumentar via Firebase Analytics (já no projeto: `firebase-analytics`). Eventos sugeridos:
> `home_categoria_click`, `home_banner_click`, `busca_sugestao_click`, `combo_add_cart`,
> `parceiro_click`, `ia_assistente_open`, `ia_nicho_sugerido`.

---

## 🧱 Estimativa de esforço (relativa)

| Feature | Complexidade | Risco | Nota |
|---------|--------------|-------|------|
| Categorias horizontais | Baixa | Baixo | RecyclerView horizontal; adapter já existe parecido |
| Banner rotativo | Baixa-Média | Baixo | ViewPager2 (já no projeto) + auto-scroll + dots |
| Busca inteligente | Média | Baixo | Reusa `ServiceSearchHelper`; dropdown de sugestões |
| Combos promocionais | Média | Médio | UI nova + admin CRUD; lógica de desconto já existe |
| Parceiros | Média | Baixo | CRUD + seção; imagens via Storage/URL |
| Assistente IA (app) | Média-Alta | Médio | Proxy backend + prompt + parsing + roteamento |
| Montagem Home | Média | Médio | Regressão de layout/scroll/insets |
| Copiloto IA (painel) | Média | Baixo | Rota Next.js + Groq + grounding no Manual + widget de chat |

---

## ✅ Status global da leva

| # | Feature | Painel | Firestore/Regras | App | QA | Status |
|---|---------|--------|------------------|-----|----|--------|
| 1 | Banner rotativo | [x] | [x] | [x] | [ ] | 🟡 Requer polimento visual UX |
| 2 | Categorias horizontais | n/a | reusa `service_categories` | [x] | [ ] | 🟡 Requer polimento visual UX |
| 3 | Combos promocionais | [x] | [x] | [x] | [ ] | 🟡 Requer polimento visual UX |
| 4 | Parceiros | [x] | [x] | [x] | [ ] | 🟡 Requer polimento visual UX |
| 5 | Busca inteligente | n/a | reusa `catalog_services` | [x] | [ ] | 🟡 Requer polimento visual UX |
| 6 | Assistente IA (app) | [x] (proxy `/api/ai/classify`) | n/a | [x] | [~] | 🟢 No ar (Render + `GROQ_API_KEY` configurada); falta só teste no app c/ APK |
| 7 | Home Premium (montagem) | n/a | n/a | [x] | [ ] | 🟢 Montada (ordem Premium + pull-to-refresh + CTA IA); falta QA |
| 8 | Copiloto IA (painel admin) | [x] | n/a | n/a | [x] | ✅ **No ar e validado** — Vercel + `GROQ_API_KEY`; responde com passos reais |

> **Atualização (2026-06-23):** `GROQ_API_KEY` **configurada e deployada** no Render (06) e na Vercel (08).
> Copiloto do painel (08) **validado ao vivo**. Falta só testar o Assistente do app (06) com um APK novo.

> **IMPORTANTE PARA A IA DESENVOLVEDORA:** Embora o código funcional base das features 1-5 já tenha sido comitado, **a montagem final (07)** e o polimento visual de cada item para alcançar a qualidade "Home Premium" exigida pela gerência são o trabalho de agora. Trate a interface com muito cuidado.

---

## 🧩 Decisões de arquitetura já fixadas

1. **Conteúdo é dado, não código.** Banner/combos/parceiros vivem no Firestore e são editados no painel.
2. **Padrão de coleção nova:** `read: if isSignedIn()` / `write: if false` + rota Admin SDK no painel.
3. **Pré-carregamento:** repositórios novos podem aquecer cache no `AppApplication` (como o catálogo já faz), com fallback silencioso.
4. **IA via proxy:** chave Groq fica no backend Render; o app só chama `POST /api/ai/...`.
5. **Sem novas libs pesadas:** carrossel usa `ViewPager2` (já presente); evitar dependências externas quando o nativo resolve.
</content>
