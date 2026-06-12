import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  assertOperationalTransition,
  operationalToLegacyStatus,
  resolveOperationalStatus,
  type AssignedTechnician,
  type OperationalEventPayload,
  type ServiceTimestamps,
} from "@/lib/orders/operational"
import {
  validateChecklistClosure,
  type ChecklistClosurePayload,
} from "@/lib/orders/checklist-closure"

const SERVICE_CHECKLISTS_SUBCOLLECTION = "checklists"

export interface ClosureActor {
  uid?: string
  email?: string
  name?: string
}

export interface FinalizeServiceInput {
  orderId: string
  /** Se já existe um checklist em progresso, informe seu id; senão um novo é criado. */
  checklistId?: string
  closure: ChecklistClosurePayload
  actor: ClosureActor
  /** Id idempotente da operação (evita finalização duplicada). */
  mutationId: string
  templateId?: string
  templateNome?: string
}

function asFirestore(): Firestore {
  if (!db) throw new Error("Firestore não inicializado")
  return db
}

/**
 * Lógica de mutação de estado ao receber o payload de fechamento da OS.
 *
 * Fluxo (transação única, idempotente por `mutationId`):
 *  1. Valida o payload contra o contrato (3 fotos, 2 assinaturas, termo, status, etc.).
 *  2. Grava/mescla o checklist com o desfecho e marca como `concluido`.
 *  3. Transiciona a OS para `finalizado` (estado operacional + status legado).
 *  4. Registra um evento de auditoria em `operational_events/{mutationId}`.
 *
 * Observação: o app mobile envia este payload; o painel admin pode usá-lo para
 * forçar o encerramento. As fotos/assinaturas são gravadas pelo mobile no checklist;
 * aqui consolidamos o desfecho e disparamos a finalização.
 */
export async function finalizeServiceFromChecklist(input: FinalizeServiceInput): Promise<{ checklistId: string }> {
  const pendencias = validateChecklistClosure(input.closure)
  if (pendencias.length > 0) {
    throw new Error(`Não é possível finalizar. Pendências: ${pendencias.join(" ")}`)
  }

  const firestore = asFirestore()
  const orderRef = doc(firestore, "orders", input.orderId)
  const eventRef = doc(firestore, "orders", input.orderId, "operational_events", input.mutationId)
  const checklistRef = input.checklistId
    ? doc(firestore, "orders", input.orderId, SERVICE_CHECKLISTS_SUBCOLLECTION, input.checklistId)
    : doc(collection(firestore, "orders", input.orderId, SERVICE_CHECKLISTS_SUBCOLLECTION))

  await runTransaction(firestore, async (transaction) => {
    const [orderSnap, eventSnap] = await Promise.all([
      transaction.get(orderRef),
      transaction.get(eventRef),
    ])

    if (!orderSnap.exists()) {
      throw new Error("Pedido não encontrado.")
    }
    if (eventSnap.exists()) {
      // Já finalizado com este mutationId — operação idempotente.
      return
    }

    const data = orderSnap.data() as Record<string, unknown>
    const from = resolveOperationalStatus(data)
    const assigned = data.assignedTechnician as AssignedTechnician | undefined
    const timestamps = (data.serviceTimestamps as ServiceTimestamps | undefined) || {}

    // Garante que a transição para "finalizado" é válida a partir do estado atual.
    assertOperationalTransition(from, "finalizado", {
      hasAssignedTechnician: Boolean(assigned?.id || data.providerId),
      serviceTimestamps: timestamps,
      // A evidência já foi validada acima pelo contrato de fechamento.
      completionBlockers: [],
    })

    const now = Timestamp.now()
    const mergedTimestamps: ServiceTimestamps = {
      ...timestamps,
      executionStartedAt: timestamps.executionStartedAt ?? now,
      finishedAt: now,
    }

    // 1) Checklist com o desfecho consolidado
    const checklistData: Record<string, unknown> = {
      orderId: input.orderId,
      status: "concluido",
      servicosRealizados: input.closure.servicosRealizados,
      avariasPreExistentes: input.closure.avariasPreExistentes ?? "",
      statusFechamento: input.closure.statusFechamento,
      observacoesTecnicas: input.closure.observacoes,
      termoAceite: {
        aceito: input.closure.termoAceite.aceito,
        texto: input.closure.termoAceite.texto,
        aceitoEm: now,
        aceitoPor: input.closure.termoAceite.aceitoPor ?? input.actor.name ?? input.actor.email ?? null,
      },
      providerId: assigned?.id ?? data.providerId ?? null,
      providerNome: assigned?.name ?? data.providerName ?? null,
      concluidoEm: now,
      updatedAt: serverTimestamp(),
    }
    if (input.templateId) checklistData.templateId = input.templateId
    if (input.templateNome) checklistData.templateNome = input.templateNome
    if (!input.checklistId) {
      checklistData.createdAt = serverTimestamp()
      checklistData.iniciadoEm = timestamps.executionStartedAt ?? now
    }

    transaction.set(checklistRef, checklistData, { merge: true })

    // 2) Evento de auditoria
    const eventPayload: OperationalEventPayload = {
      at: now,
      type: "status_change",
      fromStatus: from,
      toStatus: "finalizado",
      actorUid: input.actor.uid,
      actorEmail: input.actor.email,
      actorName: input.actor.name,
      note: `Fechamento: ${input.closure.statusFechamento}`,
      mutationId: input.mutationId,
    }
    transaction.set(eventRef, {
      ...eventPayload,
      previousOperationalStatus: from,
      newOperationalStatus: "finalizado",
      checklistId: checklistRef.id,
      statusFechamento: input.closure.statusFechamento,
      createdAt: serverTimestamp(),
    })

    // 3) Ordem → finalizado
    transaction.update(orderRef, {
      serviceOperationalStatus: "finalizado",
      serviceTimestamps: mergedTimestamps,
      status: operationalToLegacyStatus("finalizado"),
      statusFechamento: input.closure.statusFechamento,
      checklistConcluido: true,
      completedAt: now,
      completedBy: input.actor.email || input.actor.uid || "admin",
      lastOperationalMutationId: input.mutationId,
      updatedAt: serverTimestamp(),
    })
  })

  return { checklistId: checklistRef.id }
}
