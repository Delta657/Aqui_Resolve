# Sistema de Checklist OS (Ordem de Serviço)

## Visão Geral

O **Sistema de Checklist OS** é um subsistema do AquiResolve que permite ao prestador de serviço registrar toda a execução de uma ordem de serviço diretamente pelo aplicativo. O objetivo é gerar um **histórico completo e auditável** de cada atendimento, garantindo transparência tanto para o prestador quanto para o cliente.

Principais propósitos:

- **Registrar a execução do trabalho** desde a chegada até a finalização
- **Gerar histórico** detalhado com evidências visuais e documentais
- **Dar transparência** ao cliente sobre o que foi executado
- **Coletar evidências** (fotos, assinaturas, GPS) para comprovação do serviço

## Fluxo do Processo

### 1. Início do Serviço

Ao clicar em "Iniciar OS" no OrderDetailsActivity, o sistema:

1. Captura a **localização GPS** atual do prestador
2. Registra o **timestamp** de início
3. **Cria um documento** na coleção `checklists/{orderId}` com status `in_progress`
4. Navega para a ChecklistActivity

### 2. Checklist (ChecklistActivity)

O prestador responde a **10 perguntas** divididas em 2 blocos:

**Bloco 1 — Chegada ao Local:**
- Cliente presente?
- Serviço corresponde ao pedido?
- Danos visíveis no local?
- Material disponível para execução?
- Observações do cliente registradas?

**Bloco 2 — Execução do Serviço:**
- Executado conforme solicitado?
- Serviço adicional necessário?
- Peças substituídas?
- Valor sofreu alteração?
- Serviço concluído?

Além das perguntas, o prestador deve preencher uma **descrição detalhada** da execução.

O checklist pode ser salvo como **rascunho** (parcial) ou **finalizado** (avança para fotos).

### 3. Fotos (PhotoEvidenceActivity)

Três categorias de fotos, cada uma com suporte para **até 3 fotos**:

| Categoria | Campo no Firestore | Descrição |
|---|---|---|
| Antes | `photosBefore` | Estado inicial do local |
| Durante | `photosDuring` | Execução do serviço |
| Depois | `photosAfter` | Resultado final |

Funcionalidades:
- Captura pela **câmera** ou seleção da **galeria**
- **Compressão** automática (max 1MB / 1920x1080)
- **Upload** para Firebase Storage
- **Preview** das fotos com opção de remoção
- Navegação para tela de assinaturas ao finalizar

### 4. Assinaturas Digitais (DigitalSignatureActivity)

Duas etapas de assinatura obrigatórias:

**Assinatura do Prestador:**
- Nome completo
- Desenho da assinatura em um **SignaturePad** (canvas de desenho à mão livre)
- Convertida para PNG e enviada ao Firebase Storage

**Assinatura do Cliente:**
- Nome completo
- Documento (CPF/RG)
- Desenho da assinatura no SignaturePad
- Convertida para PNG e enviada ao Firebase Storage

### 5. Finalização

Após a assinatura do cliente, o checklist é marcado como `completed`, registrando o timestamp de conclusão. O prestador é redirecionado para a ProviderHomeActivity.

## Estrutura de Dados

### Coleção Firestore

```
checklists/{orderId}
```

### Status do Checklist

| Status | Descrição |
|---|---|
| `checklist_pending` | Respondendo os dados textuais, categorias e perguntas do checklist |
| `photos_pending` | Capturando e enviando fotos |
| `signatures_pending` | Coletando assinaturas |
| `completed` | Checklist finalizado |

### Modelo — OsChecklistData

| Campo | Tipo | Descrição |
|---|---|---|
| `orderId` | String | ID do pedido (nome do documento) |
| `status` | String | Status atual do checklist |
| `startLatitude` | Double? | Latitude GPS no início |
| `startLongitude` | Double? | Longitude GPS no início |
| `startedAt` | Timestamp? | Momento do início do serviço |
| `clientPresent` | Boolean? | Cliente presente? |
| `serviceMatches` | Boolean? | Serviço corresponde ao pedido? |
| `visibleDamage` | Boolean? | Danos visíveis no local? |
| `materialAvailable` | Boolean? | Material disponível? |
| `clientObservations` | Boolean? | Observações do cliente? |
| `executedAsRequested` | Boolean? | Executado conforme solicitado? |
| `additionalService` | Boolean? | Serviço adicional necessário? |
| `partsReplaced` | Boolean? | Peças substituídas? |
| `valueChanged` | Boolean? | Valor alterado? |
| `serviceCompleted` | Boolean? | Serviço concluído? |
| `cleanAfterService` | Boolean? | Local limpo após execução? |
| `serviceDescription` | List\<String\> | Categorias/tipos do serviço executado |
| `preExistingDamages` | String | Avarias pré-existentes informadas ao beneficiário |
| `problemResolution` | String | Resultado do problema: `resolved`, `return_needed` ou `not_resolved` |
| `declarationAccepted` | Boolean? | Declaração de veracidade aceita pelo prestador |
| `executionDescription` | String | Descrição detalhada da execução |
| `observations` | String | Observações adicionais do atendimento |
| `photosBefore` | List\<String\> | URLs das fotos "antes" |
| `photosDuring` | List\<String\> | URLs das fotos "durante" |
| `photosAfter` | List\<String\> | URLs das fotos "depois" |
| `photoTimestampsBefore` | List\<Timestamp\> | Timestamps das fotos "antes" |
| `photoTimestampsDuring` | List\<Timestamp\> | Timestamps das fotos "durante" |
| `photoTimestampsAfter` | List\<Timestamp\> | Timestamps das fotos "depois" |
| `providerSignatureUrl` | String? | URL da assinatura do prestador |
| `providerSignatureName` | String? | Nome do prestador na assinatura |
| `providerSignedAt` | Timestamp? | Data da assinatura do prestador |
| `clientSignatureUrl` | String? | URL da assinatura do cliente |
| `clientSignatureName` | String? | Nome do cliente na assinatura |
| `clientSignatureDocument` | String? | Documento do cliente |
| `clientSignedAt` | Timestamp? | Data da assinatura do cliente |
| `completedAt` | Timestamp? | Data de conclusão |
| `createdAt` | Timestamp | Data de criação |
| `updatedAt` | Timestamp | Data da última atualização |

### Propriedades Computadas (OsChecklistData)

| Propriedade | Descrição |
|---|---|
| `checklistStep1Complete` | Bloco 1 (chegada) totalmente preenchido |
| `checklistStep2Complete` | Bloco 2 (execução), categorias, solução do problema e declaração preenchidos |
| `checklistComplete` | Ambos blocos + descrição detalhada preenchidos |
| `photosComplete` | Pelo menos 1 foto em cada categoria |
| `providerSignatureComplete` | Assinatura do prestador realizada |
| `clientSignatureComplete` | Assinatura do cliente realizada |
| `isComplete` | Checklist + fotos + ambas assinaturas concluídos |

## Telas

### Checklist textual

A tela `ChecklistActivity` coleta:

- categorias em `serviceDescription`: Elétrico, Encanador, Desentupimento, Check-Up, Limpeza de Caixa d'água, Limpeza de Calhas e Rufos, Limpeza de Caixa de Gordura, Chaveiro e Instalação de ventilador;
- avarias pré-existentes em `preExistingDamages`;
- descrição detalhada em `executionDescription`;
- solução do problema em `problemResolution`;
- observações gerais em `observations`;
- declaração de veracidade em `declarationAccepted`.

Para avançar para fotos, o app exige pelo menos uma categoria em `serviceDescription`, descrição detalhada, resolução do problema e aceite da declaração.

### Próximas etapas visuais

O fluxo ainda permanece dividido em três telas: checklist textual, fotos e assinaturas. Para ficar idêntico ao modelo visual de referência, a próxima etapa é consolidar fotos e assinaturas na mesma tela do checklist, adicionar o card de status da sincronização no topo e reproduzir o cabeçalho/menu inferior operacional.

### ChecklistActivity

- **Pacote:** `com.aquiresolve.app.ChecklistActivity`
- **Layout:** `activity_checklist.xml`
- **Função:** Exibe 10 checkboxes em 2 blocos (chegada + execução) e um campo de descrição detalhada
- **Recursos:** Botão salvar rascunho, botão finalizar, validação de campos obrigatórios

### PhotoEvidenceActivity

- **Pacote:** `com.aquiresolve.app.PhotoEvidenceActivity`
- **Layout:** `activity_photo_evidence.xml`
- **Função:** Três RecyclerViews lado a lado (antes/durante/depois) com botão de captura em cada
- **Recursos:** Câmera, galeria, upload Storage, preview, remoção de fotos

### DigitalSignatureActivity

- **Pacote:** `com.aquiresolve.app.DigitalSignatureActivity`
- **Layout:** `activity_digital_signature.xml`
- **Função:** Tela com abas para assinatura do prestador e do cliente
- **Recursos:** SignaturePad, campos de nome/documento, upload Storage

### OsHistoryActivity

- **Pacote:** `com.aquiresolve.app.OsHistoryActivity`
- **Layout:** `activity_os_history.xml`
- **Função:** Visualização completa do checklist, fotos, assinaturas e dados GPS
- **Recursos:** Exibição de todas as fotos em grid, preview de assinaturas, localização no mapa

## Classes Criadas

| Classe | Tipo | Caminho |
|---|---|---|
| `OsChecklistData` | Data class | `models/OsChecklistData.kt` |
| `FirebaseChecklistManager` | Manager | `FirebaseChecklistManager.kt` |
| `SignaturePad` | Custom View | `views/SignaturePad.kt` |
| `OsPhotosAdapter` | Adapter | `adapters/OsPhotosAdapter.kt` |
| `ChecklistActivity` | Activity | `ChecklistActivity.kt` |
| `PhotoEvidenceActivity` | Activity | `PhotoEvidenceActivity.kt` |
| `DigitalSignatureActivity` | Activity | `DigitalSignatureActivity.kt` |
| `OsHistoryActivity` | Activity | `OsHistoryActivity.kt` |

### Layouts XML Criados

- `res/layout/activity_checklist.xml`
- `res/layout/activity_photo_evidence.xml`
- `res/layout/activity_digital_signature.xml`
- `res/layout/activity_os_history.xml`

## Arquivos Modificados

| Arquivo | Alteração |
|---|---|
| `OrderDetailsActivity.kt` | Integração do fluxo OS — botão "Iniciar OS", verificação de checklist existente, navegação entre etapas, listener de status |
| `AndroidManifest.xml` | Registro das 4 novas Activities |
| `res/values/strings.xml` | Strings das novas telas, mensagens de validação, labels |

## Fluxo de Navegação

```
OrderDetailsActivity
    │
    ├─ [Iniciar OS / Continuar OS]
    │
    ▼
ChecklistActivity
    │
    ├─ [Finalizar checklist]
    │
    ▼
PhotoEvidenceActivity
    │
    ├─ [Fotos enviadas]
    │
    ▼
DigitalSignatureActivity
    │
    ├─ [Assinatura prestador → Assinatura cliente]
    │
    ▼
ProviderHomeActivity (finalização)
```

### Pontos de Retomada

O sistema verifica o status atual do checklist ao carregar o OrderDetailsActivity:

- `checklist_pending` → retoma para ChecklistActivity
- `photos_pending` → retoma para PhotoEvidenceActivity
- `signatures_pending` → retoma para DigitalSignatureActivity
- `completed` → abre OsHistoryActivity (visualização apenas)
