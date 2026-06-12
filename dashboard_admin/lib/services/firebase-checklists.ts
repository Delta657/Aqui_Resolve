import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type {
  ChecklistTemplate,
  ChecklistTemplateFilters,
  ChecklistTemplateItem,
  ServiceChecklist,
  ServiceChecklistFilters,
  ServiceChecklistStatus,
  ChecklistStats,
} from "@/types/checklist"

const TEMPLATES_COLLECTION = "checklist_templates"
const SERVICE_CHECKLISTS_SUBCOLLECTION = "checklists"

// ─── Helpers ────────────────────────────────────────────────────────────────

function asDb() {
  if (!db) throw new Error("Firestore não inicializado")
  return db
}

function newItemId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `item_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

// ─── Templates ──────────────────────────────────────────────────────────────

export async function getChecklistTemplates(
  filters?: ChecklistTemplateFilters
): Promise<ChecklistTemplate[]> {
  const firestore = asDb()
  const ref = collection(firestore, TEMPLATES_COLLECTION)

  const constraints: Parameters<typeof query>[1][] = [orderBy("createdAt", "desc")]

  if (filters?.ativo !== undefined) {
    constraints.push(where("ativo", "==", filters.ativo))
  }
  if (filters?.cliente && filters.cliente !== "TODOS") {
    constraints.push(where("cliente", "==", filters.cliente))
  }

  const q = query(ref, ...constraints)
  const snap = await getDocs(q)

  let results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChecklistTemplate))

  if (filters?.search) {
    const term = filters.search.toLowerCase()
    results = results.filter(
      (t) =>
        t.nome.toLowerCase().includes(term) ||
        t.descricao.toLowerCase().includes(term) ||
        t.tiposServico.some((s) => s.toLowerCase().includes(term))
    )
  }

  if (filters?.tipoServico) {
    results = results.filter(
      (t) =>
        t.tiposServico.includes("*") ||
        t.tiposServico.some((s) =>
          s.toLowerCase().includes(filters.tipoServico!.toLowerCase())
        )
    )
  }

  return results
}

export function subscribeChecklistTemplates(
  onData: (templates: ChecklistTemplate[]) => void,
  onError?: (err: Error) => void,
  filters?: ChecklistTemplateFilters
): Unsubscribe {
  const firestore = asDb()
  const constraints: Parameters<typeof query>[1][] = [orderBy("createdAt", "desc")]

  if (filters?.ativo !== undefined) {
    constraints.push(where("ativo", "==", filters.ativo))
  }

  const q = query(collection(firestore, TEMPLATES_COLLECTION), ...constraints)

  return onSnapshot(
    q,
    (snap) => {
      let templates = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChecklistTemplate))
      if (filters?.search) {
        const term = filters.search.toLowerCase()
        templates = templates.filter(
          (t) =>
            t.nome.toLowerCase().includes(term) ||
            t.descricao.toLowerCase().includes(term)
        )
      }
      onData(templates)
    },
    (err) => onError?.(err)
  )
}

export async function getChecklistTemplate(id: string): Promise<ChecklistTemplate | null> {
  const snap = await getDoc(doc(asDb(), TEMPLATES_COLLECTION, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as ChecklistTemplate
}

export interface CreateTemplateInput {
  nome: string
  descricao: string
  tiposServico: string[]
  cliente: string
  itens: Omit<ChecklistTemplateItem, "id">[]
  ativo: boolean
  obrigatorio: boolean
  actorId: string
  actorName?: string
}

export async function createChecklistTemplate(input: CreateTemplateInput): Promise<string> {
  const firestore = asDb()

  const itensComId: ChecklistTemplateItem[] = input.itens.map((item, idx) => ({
    ...item,
    id: newItemId(),
    ordem: item.ordem ?? idx,
  }))

  const data: Omit<ChecklistTemplate, "id"> = {
    nome: input.nome.trim(),
    descricao: input.descricao.trim(),
    tiposServico: input.tiposServico,
    cliente: input.cliente || "TODOS",
    itens: itensComId,
    ativo: input.ativo,
    obrigatorio: input.obrigatorio,
    versao: 1,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    createdBy: input.actorId,
  }

  const ref = await addDoc(collection(firestore, TEMPLATES_COLLECTION), data)
  return ref.id
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  id: string
}

export async function updateChecklistTemplate(input: UpdateTemplateInput): Promise<void> {
  const firestore = asDb()
  const ref = doc(firestore, TEMPLATES_COLLECTION, input.id)

  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
    updatedBy: input.actorId,
  }

  if (input.nome !== undefined) updates.nome = input.nome.trim()
  if (input.descricao !== undefined) updates.descricao = input.descricao.trim()
  if (input.tiposServico !== undefined) updates.tiposServico = input.tiposServico
  if (input.cliente !== undefined) updates.cliente = input.cliente
  if (input.ativo !== undefined) updates.ativo = input.ativo
  if (input.obrigatorio !== undefined) updates.obrigatorio = input.obrigatorio

  if (input.itens !== undefined) {
    const existing = (await getDoc(ref)).data()
    const currentVersion = (existing?.versao as number) || 1
    updates.versao = currentVersion + 1
    updates.itens = input.itens.map((item, idx) => ({
      ...item,
      id: (item as ChecklistTemplateItem).id || newItemId(),
      ordem: (item as ChecklistTemplateItem).ordem ?? idx,
    }))
  }

  await updateDoc(ref, updates)
}

export async function toggleChecklistTemplateStatus(
  id: string,
  ativo: boolean
): Promise<void> {
  await updateDoc(doc(asDb(), TEMPLATES_COLLECTION, id), {
    ativo,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteChecklistTemplate(id: string): Promise<void> {
  await deleteDoc(doc(asDb(), TEMPLATES_COLLECTION, id))
}

// ─── Checklists de Serviço ───────────────────────────────────────────────────

export async function getServiceChecklists(
  orderId: string
): Promise<ServiceChecklist[]> {
  const firestore = asDb()
  const ref = collection(
    firestore,
    "orders",
    orderId,
    SERVICE_CHECKLISTS_SUBCOLLECTION
  )
  const q = query(ref, orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceChecklist))
}

export function subscribeServiceChecklists(
  orderId: string,
  onData: (checklists: ServiceChecklist[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const firestore = asDb()
  const ref = collection(
    firestore,
    "orders",
    orderId,
    SERVICE_CHECKLISTS_SUBCOLLECTION
  )
  const q = query(ref, orderBy("createdAt", "desc"))

  return onSnapshot(
    q,
    (snap) => {
      const checklists = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceChecklist))
      onData(checklists)
    },
    (err) => onError?.(err)
  )
}

export async function getServiceChecklist(
  orderId: string,
  checklistId: string
): Promise<ServiceChecklist | null> {
  const snap = await getDoc(
    doc(asDb(), "orders", orderId, SERVICE_CHECKLISTS_SUBCOLLECTION, checklistId)
  )
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as ServiceChecklist
}

export async function updateServiceChecklistStatus(
  orderId: string,
  checklistId: string,
  status: ServiceChecklistStatus
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  }
  if (status === "concluido") {
    updates.concluidoEm = serverTimestamp()
  }
  await updateDoc(
    doc(asDb(), "orders", orderId, SERVICE_CHECKLISTS_SUBCOLLECTION, checklistId),
    updates
  )
}

// ─── Validação de início ──────────────────────────────────────────────────────

export async function getServiceValidation(
  orderId: string
): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(doc(asDb(), "orders", orderId))
  if (!snap.exists()) return null
  const data = snap.data()
  return (data?.serviceValidation as Record<string, unknown>) ?? null
}

export function subscribeOrderValidation(
  orderId: string,
  onData: (validation: Record<string, unknown> | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const ref = doc(asDb(), "orders", orderId)
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null)
        return
      }
      const data = snap.data()
      onData((data?.serviceValidation as Record<string, unknown>) ?? null)
    },
    (err) => onError?.(err)
  )
}

// ─── Estatísticas ─────────────────────────────────────────────────────────────

export async function getChecklistStats(): Promise<ChecklistStats> {
  const firestore = asDb()
  const snap = await getDocs(collection(firestore, TEMPLATES_COLLECTION))

  const templates = snap.docs.map((d) => d.data() as Omit<ChecklistTemplate, "id">)
  const ativos = templates.filter((t) => t.ativo).length

  const porTipoServico: Record<string, number> = {}
  for (const t of templates) {
    for (const tipo of t.tiposServico) {
      porTipoServico[tipo] = (porTipoServico[tipo] || 0) + 1
    }
  }

  return {
    total: templates.length,
    ativos,
    inativos: templates.length - ativos,
    porTipoServico,
    preenchidosHoje: 0,
    preenchidosMes: 0,
    taxaConclusao: 0,
  }
}
