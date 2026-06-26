# 10-reorganizacao-home-cliente-ia-navbar.md

**Data:** 2026-06-26
**Solicitante:** Álvaro (áudio WhatsApp)
**Branch:** main

## O que foi feito

Reorganização da tela inicial do cliente + mover acesso ao assistente IA da Home para a barra de navegação inferior.

### 1. Nova ordem das seções na Home

| # | Seção | Antes | Depois |
|---|-------|-------|--------|
| 1 | Sugestões de busca | GONE (topo) | — |
| 2 | Saudação "Olá!" | depois de parceiros | — |
| 3 | 💸 Card Cashback | depois de categorias | **subiu** |
| 4 | Banners promocionais | depois da busca | — |
| 5 | Categorias (nichos) | depois da saudação | — |
| 6 | 🔥 Combos | depois do cashback | — |
| 7 | Parceiros | depois dos banners | **desceu pro final** |
| — | 🤖 Card IA (Hello) | depois dos combos | **removido** |

### 2. Assistente IA na barra inferior

- Removido o `cardAssistant` da Home
- Adicionado item "Hello" na `BottomNavigationView` (ícone `ic_assistant.xml`)
- Nova ordem da barra: **Início | Serviços | Pedidos | Hello | Perfil**
- Ao clicar → abre `AssistantChatActivity` (chat multi-turno com streaming Groq)

### 3. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `activity_client_home.xml` | Reordenação das seções no `LinearLayout` do conteúdo; remoção do `cardAssistant` |
| `bottom_nav_menu.xml` | Novo `<item>` `navigation_assistant` com `ic_assistant` |
| `ic_assistant.xml` | Vector drawable novo (ícone de engrenagem/IA, 24dp) |
| `ClientHomeActivity.kt` | Removido listener `cardAssistant`; adicionado `R.id.navigation_assistant → AssistantChatActivity` |

### 4. Build

- `./gradlew :app:assembleDebug` → **BUILD SUCCESSFUL** (1m24s)
- APK debug: 15MB em `app/build/outputs/apk/debug/app-debug.apk`
