# Remoção de opções do Checklist da OS — 2026-06-29

## Pedido

Remover do checklist da Ordem de Serviço (tela do app preenchida pelo prestador):

1. O card **"Descrição do Serviço"** inteiro (checkboxes de nicho):
   Elétrico, Encanador, Desentupimento, Check-Up, Limpeza de Caixa d'água,
   Limpeza de Calhas e Rufos, Limpeza de Caixa de Gordura, Chaveiro,
   Instalação de ventilador.
2. O card **"O problema foi solucionado?"** (radio):
   "Sim, concluído com sucesso.", "Não, mas haverá retorno.",
   "Não, e não haverá retorno.".

## Onde estava

- **Layout:** `app/src/main/res/layout/activity_checklist.xml` — dois
  `MaterialCardView` (checkboxes `cbService*` e `RadioGroup rgProblemResolution`
  com `rbResolved`/`rbReturnNeeded`/`rbNotResolved`).
- **Lógica:** `app/src/main/java/com/aquiresolve/app/ChecklistActivity.kt` — esses IDs
  eram usados em listeners, no resumo de pendências, na validação do passo 1, na
  coleta para salvar e na restauração de um checklist existente.

## O que foi feito

### Layout (`activity_checklist.xml`)
- Removidos por completo os dois cards ("Descrição do Serviço" e
  "O problema foi solucionado?").

### Activity (`ChecklistActivity.kt`)
- `setupPendingSummaryWatchers`: removidos os listeners dos 9 checkboxes de serviço
  e do `rgProblemResolution`.
- `updatePendingSummary`: removidas as pendências "Descrição do serviço (marque ao
  menos uma)" e "Indicar se o problema foi solucionado".
- `validateStep1`: removidas as duas validações obrigatórias correspondentes — o
  prestador não precisa mais marcar nicho nem a resolução para avançar.
- `collectServiceDescriptions()` agora retorna `emptyList()` e `getProblemResolution()`
  retorna `""` — **mantendo a assinatura de `saveChecklistAnswers` e o contrato de
  dados** (Firestore/OS/PDF/painel) intactos. Os campos passam a ser gravados vazios,
  sem reescrever o modelo nem o gerador de PDF nem a tela de OS do painel.
- `populateExistingChecklist`: removida a restauração dos checkboxes de serviço e do
  radio de resolução.

### Decisão de escopo
Optei por **não** remover os campos `serviceDescription`/`problemResolution` do modelo
de dados, do `FirebaseChecklistManager`, do `OsPdfGenerator` nem da página de OS do
painel. Isso evita uma mudança transversal arriscada e mantém compatibilidade com OS
já gravadas. Como os campos passam a ser salvos vazios, as seções correspondentes do
PDF/painel simplesmente ficam em branco para novas OS. Se desejado, podemos ocultá-las
também em uma etapa seguinte.

## Verificação

- `grep` confirmou **zero** referências remanescentes aos IDs removidos em `app/src`.
- `./gradlew :app:compileDebugKotlin` e `:app:assembleDebug` → **BUILD SUCCESSFUL**.

## Arquivos alterados

- `app/src/main/res/layout/activity_checklist.xml`
- `app/src/main/java/com/aquiresolve/app/ChecklistActivity.kt`

APK: `app/build/outputs/apk/debug/app-debug.apk` (debug). Exige novo APK nos aparelhos.
