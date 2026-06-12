import {
  arrayUnion,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  assertMonotonicServiceTimestamps,
  assertOperationalTransition,
  operationalToLegacyStatus,
  resolveOperationalStatus,
  type AssignedTechnician,
  type OperationalEventPayload,
  type ServiceOperationalStatus,
  type ServiceTimestamps,
  type TechnicianHistoryEntry,
} from "@/lib/orders/operational"

export interface OperationalActor {
  uid?: string
  email?: string
  name?: string
}

export interface ApplyOperationalTransitionInput {
  orderId: string
  toStatus: ServiceOperationalStatus
  actor: OperationalActor
  note?: string
  mutationId: string
  technician?: Partial<AssignedTechnician> & { id: string; name: string }
}

export interface ReassignTechnicianInput {
  orderId: string
  mutationId: string
  actor: OperationalActor
  technician: { id: string; name: string; team?: string; avatarUrl?: string }
  reason?: string
}

function asFirestore(): Firestore {
  if (!db) {
    throw new Error("Firestore não inicializado")
  }
  return db
}

function mergeTimestampsForTransition(
  from: ServiceOperationalStatus,
  to: ServiceOperationalStatus,
  current: ServiceTimestamps | undefined,
  now: Timestamp
): ServiceTimestamps {
  const next: ServiceTimestamps = { ...(current || {}) }

  if (to === "aceite_pelo_tecnico") {
    next.acceptedAt = next.acceptedAt ?? now
  }
  if (to === "em_deslocamento") {
    next.departureAt = next.departureAt ?? now
  }
  if (to === "chegou_no_local") {
    next.arrivalAt = next.arrivalAt ?? now
  }
  if (to === "em_atendimento") {
    next.executionStartedAt = next.executionStartedAt ?? now
    if (from === "pausado") {
      const intervals = [...(next.pauseIntervals || [])]
      const last = intervals[intervals.length - 1]
      if (last && !last.end) {
        last.end = now
        next.pauseIntervals = intervals
      }
    }
  }
  if (to === "pausado") {
    const intervals = [...(next.pauseIntervals || [])]
    intervals.push({ start: now })
    next.pauseIntervals = intervals
  }
  if (to === "aguardando_cliente") {
    next.waitingClientAt = now
  }
  if (to === "finalizado") {
    next.finishedAt = now
    if (!next.executionStartedAt) {
      next.executionStartedAt = now
    }
  }
  if (to === "cancelado") {
    next.cancelledOperationalAt = now
  }

  return next
}

export async function applyOperationalTransition(input: ApplyOperationalTransitionInput): Promise<void> {
  const firestore = asFirestore()
  const orderRef = doc(firestore, "orders", input.orderId)
  const eventRef = doc(firestore, "orders", input.orderId, "operational_events", input.mutationId)

  await runTransaction(firestore, async (transaction) => {
    const [orderSnap, eventSnap] = await Promise.all([transaction.get(orderRef), transaction.get(eventRef)])

    if (!orderSnap.exists()) {
      throw new Error("Pedido não encontrado.")
    }

    if (eventSnap.exists()) {
      return
    }

    const data = orderSnap.data() as Record<string, unknown>
    const from = resolveOperationalStatus(data)
    const currentTech = data.assignedTechnician as AssignedTechnician | undefined
    const timestamps = data.serviceTimestamps as ServiceTimestamps | undefined

    if (input.toStatus === "aceite_pelo_tecnico" && currentTech?.id && input.technician?.id && currentTech.id !== input.technician.id) {
      throw new Error("Já existe técnico atribuído. Use a ação de reatribuição explícita.")
    }

    let assignedTechnician: AssignedTechnician | undefined = currentTech
    if (input.technician?.id && input.technician?.name) {
      assignedTechnician = {
        id: input.technician.id,
        name: input.technician.name,
        team: input.technician.team ?? currentTech?.team,
        avatarUrl: input.technician.avatarUrl ?? currentTech?.avatarUrl,
        online: input.technician.online ?? currentTech?.online,
        acceptedAt: currentTech?.acceptedAt,
      }
    }

    assertOperationalTransition(from, input.toStatus, {
      hasAssignedTechnician: Boolean(assignedTechnician?.id || input.technician?.id),
      serviceTimestamps: timestamps,
    })

    const nowTs = Timestamp.now()
    const mergedTimestamps = mergeTimestampsForTransition(from, input.toStatus, timestamps, nowTs)
    assertMonotonicServiceTimestamps(mergedTimestamps)

    if (input.toStatus === "aceite_pelo_tecnico" && input.technician?.id) {
      assignedTechnician = {
        id: input.technician.id,
        name: input.technician.name,
        team: input.technician.team ?? currentTech?.team,
        avatarUrl: input.technician.avatarUrl ?? currentTech?.avatarUrl,
        online: input.technician.online,
        acceptedAt: mergedTimestamps.acceptedAt ?? nowTs,
      }
    }

    const eventPayload: OperationalEventPayload = {
      at: nowTs,
      type: "status_change",
      fromStatus: from,
      toStatus: input.toStatus,
      actorUid: input.actor.uid,
      actorEmail: input.actor.email,
      actorName: input.actor.name,
      note: input.note,
      mutationId: input.mutationId,
    }

    transaction.set(eventRef, {
      ...eventPayload,
      previousOperationalStatus: from,
      newOperationalStatus: input.toStatus,
      createdAt: serverTimestamp(),
    })

    const legacy = operationalToLegacyStatus(input.toStatus)
    const updatePayload: Record<string, unknown> = {
      serviceOperationalStatus: input.toStatus,
      serviceTimestamps: mergedTimestamps,
      status: legacy,
      updatedAt: serverTimestamp(),
      lastOperationalMutationId: input.mutationId,
    }

    if (assignedTechnician) {
      updatePayload.assignedTechnician = assignedTechnician
      updatePayload.providerId = assignedTechnician.id
      updatePayload.providerName = assignedTechnician.name
      const prevPrestador =
        typeof data.prestador === "object" && data.prestador !== null ? (data.prestador as Record<string, unknown>) : {}
      updatePayload.prestador = {
        ...prevPrestador,
        id: assignedTechnician.id,
        nome: assignedTechnician.name,
      }
    }

    if (input.toStatus === "cancelado") {
      updatePayload.cancelledAt = mergedTimestamps.cancelledOperationalAt ?? serverTimestamp()
      updatePayload.cancelledBy = input.actor.email || input.actor.uid || "admin"
      if (input.note) {
        updatePayload.cancellationReason = input.note
      }
    }

    if (input.toStatus === "finalizado") {
      updatePayload.completedAt = mergedTimestamps.finishedAt ?? serverTimestamp()
      updatePayload.completedBy = input.actor.email || input.actor.uid || "admin"
    }

    transaction.update(orderRef, updatePayload)
  })
}

export async function reassignTechnician(input: ReassignTechnicianInput): Promise<void> {
  const firestore = asFirestore()
  const orderRef = doc(firestore, "orders", input.orderId)
  const eventRef = doc(firestore, "orders", input.orderId, "operational_events", input.mutationId)

  await runTransaction(firestore, async (transaction) => {
    const [orderSnap, eventSnap] = await Promise.all([transaction.get(orderRef), transaction.get(eventRef)])

    if (!orderSnap.exists()) {
      throw new Error("Pedido não encontrado.")
    }
    if (eventSnap.exists()) {
      return
    }

    const data = orderSnap.data() as Record<string, unknown>
    const op = resolveOperationalStatus(data)
    if (op === "finalizado" || op === "cancelado") {
      throw new Error("Não é possível reatribuir técnico em pedido encerrado.")
    }

    const currentTech = data.assignedTechnician as AssignedTechnician | undefined
    if (currentTech?.id === input.technician.id) {
      throw new Error("O pedido já está com este técnico.")
    }

    const nowTs = Timestamp.now()

    const updatePayload: Record<string, unknown> = {
      assignedTechnician: {
        id: input.technician.id,
        name: input.technician.name,
        team: input.technician.team,
        avatarUrl: input.technician.avatarUrl,
        acceptedAt: nowTs,
      },
      providerId: input.technician.id,
      providerName: input.technician.name,
      updatedAt: serverTimestamp(),
      lastOperationalMutationId: input.mutationId,
    }

    const prevPrestador =
      typeof data.prestador === "object" && data.prestador !== null ? (data.prestador as Record<string, unknown>) : {}
    updatePayload.prestador = {
      ...prevPrestador,
      id: input.technician.id,
      nome: input.technician.name,
    }

    if (currentTech?.id) {
      const previous: TechnicianHistoryEntry = {
        technicianId: currentTech.id,
        technicianName: currentTech.name,
        team: currentTech.team,
        assignedAt: (currentTech.acceptedAt as Timestamp | undefined) ?? null,
        unassignedAt: nowTs,
        reason: input.reason || "reatribuicao",
      }
      updatePayload.technicianHistory = arrayUnion(previous)
    }

    transaction.set(eventRef, {
      at: nowTs,
      type: "technician_reassign",
      fromStatus: op,
      toStatus: op,
      previousOperationalStatus: op,
      newOperationalStatus: op,
      actorUid: input.actor.uid,
      actorEmail: input.actor.email,
      actorName: input.actor.name,
      note: input.reason,
      mutationId: input.mutationId,
      technicianId: input.technician.id,
      technicianName: input.technician.name,
      createdAt: serverTimestamp(),
    })

    transaction.update(orderRef, updatePayload)
  })
}

export { previewOperationalMetrics } from "@/lib/orders/operational"
