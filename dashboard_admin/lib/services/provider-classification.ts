import type { FirebaseProvider } from '@/lib/services/firebase-providers'

export const UNCATEGORIZED_LABEL = 'Sem categoria'

/** Chave interna para prestadores sem nenhuma especialidade (não confundir com categoria homônima). */
const UNCATEGORIZED_KEY = '__sem_especialidade__'

/** Agrupa rótulos equivalentes (acentos, caixa, espaços) para totais mais fiéis ao negócio. */
export function canonicalCategoryKey(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function pickDisplayName(votes: Map<string, number>): string {
  let best = ''
  let bestCount = -1
  for (const [name, count] of votes) {
    if (count > bestCount || (count === bestCount && name.length > best.length)) {
      best = name
      bestCount = count
    }
  }
  return best || '—'
}

export interface ProviderInCategory {
  id: string
  nome: string
}

export interface ClassificationRow {
  /** Chave estável para React (canonical ou especial para "sem categoria") */
  rowKey: string
  /** Nome exibido (variação mais frequente entre prestadores) */
  category: string
  count: number
  /** % dos prestadores do conjunto filtrado que possuem esta categoria */
  percentOfProviders: number
  /** Prestadores nesta categoria (ordenados por nome) */
  providers: ProviderInCategory[]
}

type BucketEntry = {
  displayVotes: Map<string, number>
  members: Map<string, ProviderInCategory>
}

function categoriesForProvider(provider: FirebaseProvider): string[] {
  const raw = provider.especialidades || []
  return [...new Set(raw.map((c) => String(c).trim()).filter(Boolean))]
}

function addMembership(
  bucket: Map<string, BucketEntry>,
  canonical: string,
  displayLabel: string,
  provider: FirebaseProvider
) {
  let entry = bucket.get(canonical)
  if (!entry) {
    entry = { displayVotes: new Map(), members: new Map() }
    bucket.set(canonical, entry)
  }
  if (entry.members.has(provider.id)) return

  entry.members.set(provider.id, {
    id: provider.id,
    nome: (provider.nome || 'Sem nome').trim() || 'Sem nome',
  })

  const prev = entry.displayVotes.get(displayLabel) ?? 0
  entry.displayVotes.set(displayLabel, prev + 1)
}

/**
 * Conta prestadores por categoria (um prestador com 3 categorias entra em 3 linhas).
 * Unifica rótulos pela chave canônica e lista quem está em cada categoria.
 */
export function aggregateByCategory(providers: FirebaseProvider[]): {
  rows: ClassificationRow[]
  totalProviders: number
} {
  if (providers.length === 0) {
    return { rows: [], totalProviders: 0 }
  }

  const totalProviders = providers.length
  const bucket = new Map<string, BucketEntry>()

  for (const p of providers) {
    const cats = categoriesForProvider(p)
    if (cats.length === 0) {
      addMembership(bucket, UNCATEGORIZED_KEY, UNCATEGORIZED_LABEL, p)
    } else {
      const seen = new Set<string>()
      for (const c of cats) {
        const key = canonicalCategoryKey(c)
        if (seen.has(key)) continue
        seen.add(key)
        addMembership(bucket, key, c.trim(), p)
      }
    }
  }

  const rows: ClassificationRow[] = [...bucket.entries()].map(([canonical, data]) => {
    const category =
      canonical === UNCATEGORIZED_KEY
        ? UNCATEGORIZED_LABEL
        : pickDisplayName(data.displayVotes)
    const count = data.members.size
    const percentOfProviders =
      Math.round((count / totalProviders) * 1000) / 10
    const providersSorted = [...data.members.values()].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    )
    return {
      rowKey: canonical === UNCATEGORIZED_KEY ? UNCATEGORIZED_KEY : canonical,
      category,
      count,
      percentOfProviders,
      providers: providersSorted,
    }
  })

  rows.sort((a, b) => {
    if (a.category === UNCATEGORIZED_LABEL) return 1
    if (b.category === UNCATEGORIZED_LABEL) return -1
    return b.count - a.count || a.category.localeCompare(b.category, 'pt-BR')
  })

  return { rows, totalProviders }
}
