# Contrato de Dados — Ordem de Serviço (Aqui Resolve)

> **Fonte da verdade** do formato dos documentos no Firestore. O **Painel Admin (Web)**
> e o **App Mobile (Prestador)** compartilham estas coleções. O Firestore (`onSnapshot`)
> é a camada de tempo real — faz o papel do WebSocket (sincronização Web ↔ Mobile,
> monitoramento de chat pela Base, atualização de status ao vivo).
>
> Mantenha este arquivo alinhado com:
> - `lib/orders/operational.ts` — máquina de estados operacional
> - `lib/orders/checklist-closure.ts` — contrato de fechamento
> - `lib/chat/order-chat-schema.ts` — canais de chat
> - `types/checklist.ts` — tipos do checklist

---

## 1. Coleção `orders/{orderId}`

Documento principal da OS. Campos relevantes ao fluxo operacional:

```ts
{
  // Identificação / assistência
  numero?: string,
  serviceCategory?: string,         // tipo de serviço
  description?: string,
  empresa?: string, produto?: string, protocolo?: string,

  // Cliente
  clientName?: string,
  clientPhone?: string,             // usado no deep link de WhatsApp e validação
  clientEmail?: string,
  location?: string, address?: string, city?: string, state?: string,
  latitude?: number, longitude?: number,   // deep link Google Maps / mapa em tempo real

  // Valor
  budget?: number,

  // Estado operacional (MÁQUINA DE ESTADOS — fonte da verdade)
  serviceOperationalStatus:
    | "pendente"               // criada, ainda não enviada/aceita
    | "aceite_pelo_tecnico"    // prestador aceitou o card
    | "em_deslocamento"        // a caminho
    | "chegou_no_local"
    | "aguardando_validacao"   // aguarda código do cliente p/ iniciar
    | "em_atendimento"         // serviço iniciado (código validado)
    | "pausado"
    | "aguardando_cliente"
    | "finalizado"             // OS fechada (ver checklist + statusFechamento)
    | "cancelado",

  status?: string,                  // espelho legado: pending/assigned/in_progress/completed/cancelled
  statusFechamento?: StatusFechamento,  // copiado do checklist ao finalizar (ver §4)
  checklistConcluido?: boolean,

  // Técnico/prestador atribuído
  assignedTechnician?: {
    id: string, name: string, team?: string,
    avatarUrl?: string, online?: boolean, acceptedAt?: Timestamp
  },
  providerId?: string, providerName?: string,

  // Carimbos de tempo operacionais
  serviceTimestamps?: {
    acceptedAt?, departureAt?, arrivalAt?,
    executionStartedAt?, waitingClientAt?, finishedAt?, cancelledOperationalAt?: Timestamp,
    pauseIntervals?: { start?: Timestamp, end?: Timestamp }[]
  },

  // Validação de início (código do cliente) — ver §3
  serviceValidation?: ServiceValidation,

  // SLA / auditoria
  slaDueAt?: Timestamp, slaTargetMinutes?: number,   // default 240 min
  lastOperationalMutationId?: string,
  createdAt: Timestamp, updatedAt: Timestamp,
  completedAt?: Timestamp, cancelledAt?: Timestamp
}
```

### Transições permitidas
Definidas em `ALLOWED` (`lib/orders/operational.ts`). Resumo:

```
pendente            → aceite_pelo_tecnico | cancelado
aceite_pelo_tecnico → em_deslocamento | cancelado
em_deslocamento     → chegou_no_local | cancelado
chegou_no_local     → aguardando_validacao | em_atendimento | cancelado
aguardando_validacao→ em_atendimento (exige validação confirmada) | cancelado
em_atendimento      → pausado | aguardando_cliente | finalizado | cancelado
pausado             → em_atendimento | cancelado
aguardando_cliente  → em_atendimento | pausado | cancelado
finalizado / cancelado → (terminal)
```

**Toda mutação de estado deve** registrar um evento em
`orders/{orderId}/operational_events/{mutationId}` (idempotência por `mutationId`).

---

## 2. Disparo de serviços (Web → Mobile)

### Individual
Painel cria/atualiza `orders/{orderId}` com `serviceOperationalStatus: "pendente"` e
`assignedTechnician` definido. O app do prestador escuta via `onSnapshot` uma query do tipo:

```ts
query(collection(db, "orders"),
  where("assignedTechnician.id", "==", uidPrestador),
  where("serviceOperationalStatus", "==", "pendente"))
```

e exibe o card com **Aceitar** / **Recusar**.

- **Aceitar** → transição `pendente → aceite_pelo_tecnico` (+ `operational_events`).
- **Recusar** → volta para a fila: limpar `assignedTechnician` e registrar evento
  `type: "technician_reassign"` com `reason: "recusado_pelo_tecnico"`. A OS permanece `pendente`.

### Em lote
O painel aplica a mesma escrita para N pedidos (batch). Cada documento é independente;
o mobile recebe N cards. Sem coleção extra — o lote é só a iteração no Web.

---

## 3. Validação de início (`serviceValidation`)

```ts
ServiceValidation = {
  code: string,                 // 6 dígitos
  generatedAt: Timestamp,
  expiresAt: Timestamp,         // validade 30 min
  confirmedAt?: Timestamp, confirmedBy?: string, confirmedByPhone?: string,
  attempts: number, maxAttempts: number,   // default 5
  status: "pending" | "confirmed" | "expired" | "blocked"
}
```

Fluxo: prestador em `chegou_no_local` → app/base gera `serviceValidation` (`pending`) →
cliente informa o código → mobile valida → `status: "confirmed"`. Só então é permitida a
transição `aguardando_validacao → em_atendimento`. O painel admin pode **regerar** o código.

---

## 4. Fechamento da OS — `orders/{orderId}/checklists/{checklistId}`

Subcoleção. Cada documento segue `ServiceChecklist` (`types/checklist.ts`). Campos do
**encerramento** (contrato em `lib/orders/checklist-closure.ts`):

```ts
{
  status: "concluido",
  servicosRealizados: string[],          // seleção múltipla (Elétrico, Encanador, Desentupimento, ...)
  avariasPreExistentes?: string,         // proteção jurídica (texto livre)
  statusFechamento:                      // EXATAMENTE 3 estados
    | "concluido_sucesso"                //  → "Sim, concluído com sucesso."
    | "retorno_pendente"                 //  → "Não, mas haverá retorno."
    | "nao_concluido_sem_retorno",       //  → "Não, e não haverá retorno."
  observacoesTecnicas: string,           // relato livre do desfecho
  termoAceite: {                         // checkbox jurídico obrigatório
    aceito: true, texto: string, aceitoEm: Timestamp, aceitoPor?: string
  },
  fotos: FotoServico[],                  // EXATAMENTE 3 (Antes / Durante / Depois)
  assinaturaPrestador: AssinaturaDigital,
  assinaturaCliente: AssinaturaDigital,  // segurado/cliente
  concluidoEm: Timestamp, createdAt, updatedAt: Timestamp
}
```

> **Removido do fluxo:** o campo "Quem comprou a peça?" — no modelo Aqui Resolve a compra
> é sempre responsabilidade do cliente.

### Regras obrigatórias (validadas em `validateChecklistClosure`)
- ≥ 1 serviço em `servicosRealizados`
- `statusFechamento` ∈ {3 estados}
- `observacoesTecnicas` não vazio
- `termoAceite.aceito === true`
- exatamente **3** fotos
- ambas as assinaturas presentes

### Mutação ao enviar (Mobile → backend)
Implementada em `finalizeServiceFromChecklist` (`lib/services/checklist-closure-firestore.ts`),
em transação única e idempotente:
1. valida o payload;
2. grava/mescla o checklist (`status: "concluido"` + campos acima);
3. transiciona a OS `em_atendimento → finalizado` (`serviceOperationalStatus`, `serviceTimestamps.finishedAt`, `status: "completed"`, `statusFechamento`, `completedAt`);
4. registra `operational_events/{mutationId}`.

Os 3 desfechos **finalizam** a OS no painel; `retorno_pendente` apenas sinaliza necessidade
de novo agendamento (não reabre o documento atual).

### `AssinaturaDigital`
```ts
{ dataUrl: string /* PNG base64 do canvas */, hash: string /* SHA-256 */,
  signatoryName: string, signatoryType: "cliente" | "prestador",
  signedAt: Timestamp, deviceInfo?, ipAddress? }
```

### `FotoServico`
```ts
{ id, url, thumbnailUrl?, fase: "antes"|"durante"|"depois"|"avaria",
  descricao?, lat?, lng?, timestamp, uploadedBy, storagePath }
```
Storage sugerido: `ordens-servico/{orderId}/fotos/{fase}-{id}.jpg`.

---

## 5. Chat triangular — `orders/{orderId}/messages/{messageId}`

Modelado em `lib/chat/order-chat-schema.ts`. Uma única subcoleção por OS, com **canal lógico**
no campo `threadType` — a Base (painel) monitora **todos** os canais da OS escutando a
subcoleção inteira; cliente/prestador filtram por `visibility`.

```ts
{
  text: string,
  senderId: string, senderRole: "client" | "provider" | "base",
  threadType:
    | "client_provider"   // Cliente ↔ Prestador (liberado só com serviço ativo)
    | "client_base"       // Cliente ↔ Base
    | "provider_base"     // Prestador ↔ Base
    | "admin_internal",   // notas internas (só admin)
  visibility: "public" | "admin_client" | "admin_provider" | "admin_only",
  attachments?: { url: string, type: "image" | "file", name?: string }[],
  timestamp: Timestamp,
  readBy?: string[]
}
```

`visibility` padrão por canal: `client_base→admin_client`, `provider_base→admin_provider`,
`admin_internal→admin_only`, demais `public`. A Base "monitora a sala
`chat_prestador_cliente_id`" = escutar `orders/{orderId}/messages` com `threadType == "client_provider"`.

---

## 6. Orçamentos — `orders/{orderId}/orcamentos/{orcamentoId}` (Mobile)

```ts
{
  cnpjFilial?: string, cliente: string, produto?: string,
  tipoServico: string, data: Timestamp, responsavel?: string,
  beneficiario?: string, endereco?: string, observacoes?: string,
  itens?: { descricao: string, qtd: number, valorUnit: number }[],
  total?: number, status: "rascunho" | "enviado" | "aprovado" | "recusado",
  createdAt, updatedAt: Timestamp
}
```

O painel admin lista/consulta; a criação parte do app do prestador.
