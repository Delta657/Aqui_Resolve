import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { isProviderActiveStatus } from '@/lib/providers/status'

type ProviderStatus = 'disponivel' | 'ocupado' | 'online' | 'offline'

export interface FirebaseProvider {
  id: string
  nome: string
  telefone: string
  email: string
  status: ProviderStatus
  verificationStatus?: string
  localizacao: {
    lat: number
    lng: number
  }
  /** CEP do endereço cadastrado — usado para geocodificação quando GPS não disponível */
  cep?: string
  /** Cidade do endereço cadastrado */
  cidade?: string
  /** Logradouro do endereço cadastrado */
  logradouro?: string
  ultimaAtualizacao: any
  servicoAtual?: string | null
  especialidades: string[]
  avaliacao: number
  totalServicos: number
  ativo: boolean
  createdAt: any
  updatedAt: any
}

function stringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' ? value : 0
}

function pushStringInto(set: Set<string>, value: unknown) {
  if (typeof value === 'string') {
    const t = value.trim()
    if (t) set.add(t)
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    set.add(String(value))
  }
}

function mergeArrayIntoSet(set: Set<string>, value: unknown) {
  if (!Array.isArray(value)) return
  for (const item of value) {
    if (typeof item === 'string' || typeof item === 'number') {
      pushStringInto(set, item)
    } else if (item && typeof item === 'object' && !Array.isArray(item)) {
      const o = item as Record<string, unknown>
      pushStringInto(set, o.nome ?? o.name ?? o.title ?? o.label ?? o.categoria ?? o.category)
    }
  }
}

/** Extrai categorias de serviço de múltiplos formatos usados no Firebase (app móvel). Exportado para uso em verificações. */
export function extractServiceCategories(raw: Record<string, unknown>): string[] {
  const set = new Set<string>()

  // Campos mais comuns (não usar ?? em cadeia: array vazio [] bloqueava os demais)
  mergeArrayIntoSet(set, raw.especialidades)
  mergeArrayIntoSet(set, raw.serviceCategories)
  mergeArrayIntoSet(set, raw.categories)
  mergeArrayIntoSet(set, raw.niches)
  mergeArrayIntoSet(set, raw.servicos)
  mergeArrayIntoSet(set, raw.services)

  // Objetos / mapas de serviços selecionados (boolean map)
  const servicosAtendidos = raw.servicosAtendidos ?? raw.servicosSelecionados ?? raw.nichesSelecionados
  if (Array.isArray(servicosAtendidos)) {
    mergeArrayIntoSet(set, servicosAtendidos)
  } else if (servicosAtendidos && typeof servicosAtendidos === 'object' && !Array.isArray(servicosAtendidos)) {
    const obj = servicosAtendidos as Record<string, unknown>
    const keys = Object.keys(obj).filter((k) => obj[k])
    for (const k of keys) {
      const label = k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ')
      set.add(label)
    }
  }

  // Campo único (vários nomes no app / painel)
  const singleFields = [
    raw.tipoServico,
    raw.tipo_servico,
    raw.categoria,
    raw.categoriaPrincipal,
    raw.serviceType,
    raw.tipoPrestador,
  ]
  for (const s of singleFields) {
    pushStringInto(set, s)
  }

  return [...set]
}

function normalizeProvider(raw: Record<string, unknown>, id: string): FirebaseProvider {
  const statusRaw = stringOrEmpty(raw.status ?? raw.situacao ?? raw.state).toLowerCase()
  const status: ProviderStatus =
    statusRaw === 'disponivel' ||
    statusRaw === 'ocupado' ||
    statusRaw === 'online' ||
    statusRaw === 'offline'
      ? statusRaw
      : 'offline'

  // localizacao aninhada (campo direto do app mobile)
  const loc = raw.localizacao as Record<string, unknown> | undefined

  // address é um objeto estruturado: { street, number, city, state, cep, complement, coordinates }
  const addressObj = raw.address as Record<string, unknown> | undefined
  const addressCoords = addressObj?.coordinates as Record<string, unknown> | null | undefined

  // Prioridade: localizacao.lat → address.coordinates.lat → raw.latitude → raw.lat
  const latitude = numberOrZero(
    loc?.lat ??
    (addressCoords && addressCoords.lat != null ? addressCoords.lat : undefined) ??
    raw.latitude ??
    raw.lat
  )
  const longitude = numberOrZero(
    loc?.lng ??
    (addressCoords && addressCoords.lng != null ? addressCoords.lng : undefined) ??
    raw.longitude ??
    raw.lng
  )

  const ativoValue = raw.ativo ?? raw.isActive ?? raw.active
  const ativo = typeof ativoValue === 'boolean' ? ativoValue : status !== 'offline'

  return {
    ...(raw as any),
    id,
    nome: stringOrEmpty(raw.nome ?? raw.name ?? raw.fullName ?? raw.displayName) || 'Prestador sem nome',
    telefone: stringOrEmpty(raw.telefone ?? raw.phone ?? raw.phoneNumber),
    email: stringOrEmpty(raw.email),
    status,
    verificationStatus: stringOrEmpty(raw.verificationStatus ?? raw.statusVerificacao ?? raw.verification_status),
    localizacao: { lat: latitude, lng: longitude },
    // Extrair campos de endereço para uso em geocodificação
    cep: stringOrEmpty(addressObj?.cep ?? raw.cep) || undefined,
    cidade: stringOrEmpty(addressObj?.city ?? raw.cidade ?? raw.city) || undefined,
    logradouro: stringOrEmpty(addressObj?.street ?? raw.logradouro ?? raw.street) || undefined,
    ultimaAtualizacao: raw.ultimaAtualizacao ?? raw.updatedAt ?? raw.lastSeenAt ?? raw.lastUpdate ?? null,
    servicoAtual: stringOrEmpty(raw.servicoAtual ?? raw.currentService) || null,
    especialidades: extractServiceCategories(raw),
    avaliacao: numberOrZero(raw.avaliacao ?? raw.rating),
    totalServicos: numberOrZero(raw.totalServicos ?? raw.totalOrders),
    ativo,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  }
}

export class FirebaseProvidersService {
  private static collectionName = 'providers'

  private static sortByLastUpdate(providers: FirebaseProvider[]) {
    return providers.sort((a, b) => {
      const aDate = a.ultimaAtualizacao?.toDate?.() ?? a.ultimaAtualizacao ?? new Date(0)
      const bDate = b.ultimaAtualizacao?.toDate?.() ?? b.ultimaAtualizacao ?? new Date(0)

      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  }

  static async getProviders(): Promise<FirebaseProvider[]> {
    if (!db) {
      console.warn('Firebase nao inicializado')
      return []
    }

    try {
      const snapshot = await getDocs(collection(db, this.collectionName))
      const mapped = snapshot.docs.map((currentDoc) =>
        normalizeProvider(currentDoc.data() as Record<string, unknown>, currentDoc.id)
      )

      return this.sortByLastUpdate(mapped)
    } catch (error) {
      console.error('Erro ao buscar prestadores:', error)
      return []
    }
  }

  static async getActiveProviders(): Promise<FirebaseProvider[]> {
    if (!db) {
      console.warn('Firebase nao inicializado')
      return []
    }

    try {
      const snapshot = await getDocs(collection(db, this.collectionName))
      const mapped = snapshot.docs.map((currentDoc) =>
        normalizeProvider(currentDoc.data() as Record<string, unknown>, currentDoc.id)
      )

      return this.sortByLastUpdate(
        mapped.filter((provider) => provider.ativo === true && isProviderActiveStatus(provider.status))
      )
    } catch (error) {
      console.error('Erro ao buscar prestadores ativos:', error)
      return []
    }
  }

  static async updateProviderLocation(providerId: string, lat: number, lng: number): Promise<void> {
    if (!db) {
      throw new Error('Firebase nao inicializado')
    }

    try {
      const providerRef = doc(db, this.collectionName, providerId)
      await updateDoc(providerRef, {
        'localizacao.lat': lat,
        'localizacao.lng': lng,
        ultimaAtualizacao: serverTimestamp(),
      })
    } catch (error) {
      console.error('Erro ao atualizar localizacao:', error)
      throw error
    }
  }

  static async updateProviderStatus(
    providerId: string,
    status: FirebaseProvider['status'],
    servicoAtual?: string
  ): Promise<void> {
    if (!db) {
      throw new Error('Firebase nao inicializado')
    }

    try {
      const providerRef = doc(db, this.collectionName, providerId)
      const updateData: Record<string, unknown> = {
        status,
        ultimaAtualizacao: serverTimestamp(),
      }

      if (servicoAtual !== undefined) {
        updateData.servicoAtual = servicoAtual
      }

      await updateDoc(providerRef, updateData)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      throw error
    }
  }

  static async updateProviderServiceCategories(providerId: string, categories: string[]): Promise<void> {
    if (!db) {
      throw new Error('Firebase nao inicializado')
    }

    const normalized = Array.from(
      new Set(
        categories
          .map((item) => item.trim())
          .filter(Boolean)
      )
    )

    const selectionMap = normalized.reduce<Record<string, boolean>>((acc, category) => {
      acc[category] = true
      return acc
    }, {})

    try {
      const providerRef = doc(db, this.collectionName, providerId)
      await updateDoc(providerRef, {
        especialidades: normalized,
        serviceCategories: normalized,
        categories: normalized,
        servicos: normalized,
        services: normalized,
        servicosAtendidos: normalized,
        servicosSelecionados: selectionMap,
        nichesSelecionados: selectionMap,
        categoriaPrincipal: normalized[0] ?? null,
        serviceType: normalized[0] ?? null,
        updatedAt: serverTimestamp(),
        ultimaAtualizacao: serverTimestamp(),
      })
    } catch (error) {
      console.error('Erro ao atualizar categorias de servico do prestador:', error)
      throw error
    }
  }

  static listenToActiveProviders(callback: (providers: FirebaseProvider[]) => void): () => void {
    if (!db) {
      console.warn('Firebase nao inicializado')
      callback([])
      return () => {}
    }

    try {
      const colRef = collection(db, this.collectionName)

      return onSnapshot(colRef, (snapshot) => {
        const mapped = snapshot.docs.map((currentDoc) =>
          normalizeProvider(currentDoc.data() as Record<string, unknown>, currentDoc.id)
        )

        callback(
          this.sortByLastUpdate(
            mapped.filter((provider) => provider.ativo === true && isProviderActiveStatus(provider.status))
          )
        )
      })
    } catch (error) {
      console.error('Erro ao escutar prestadores:', error)
      callback([])
      return () => {}
    }
  }
}
