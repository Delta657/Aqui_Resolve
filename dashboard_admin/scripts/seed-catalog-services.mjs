/**
 * Semeia os SERVIÇOS do catálogo na coleção `catalog_services` a partir da tabela
 * canônica de preços do backend (backend/src/services/service-pricing.service.js).
 *
 * Cada serviço vira um doc com: niche, name, estimatedPrice (R$ ao cliente),
 * providerCommissionPercent (% do prestador) e providerCommission (R$ absoluto).
 *
 * Regras de migração (preservam o comportamento atual):
 *  - estimatedPrice = clientPrice>0 ? clientPrice : round(providerValue*2)  (mesma derivação do backend)
 *  - percent        = round(providerValue / estimatedPrice * 100)
 *  - providerCommission = round(estimatedPrice * percent / 100)  (recomputado pela fórmula do painel)
 *  - isConsult quando não há preço nem repasse
 *
 * Idempotente: id determinístico `${nicheSlug}__${slug}`, merge — não apaga edições do painel.
 *
 * Rodar (de dashboard_admin/, que tem firebase-admin e .env.local):
 *   node scripts/seed-catalog-services.mjs
 */

import admin from 'firebase-admin'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function escapeNewlinesInsideJsonStrings(value) {
  let fixed = ''
  let inString = false
  let escaped = false
  for (const char of value) {
    if (escaped) {
      fixed += char
      escaped = false
    } else if (char === '\\' && inString) {
      fixed += char
      escaped = true
    } else if (char === '"') {
      inString = !inString
      fixed += char
    } else if (char === '\n' && inString) {
      fixed += '\\n'
    } else {
      fixed += char
    }
  }
  return fixed
}

function loadServiceAccount() {
  let value = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!value) {
    const envPath = resolve(__dirname, '..', '.env.local')
    const raw = readFileSync(envPath, 'utf8')
    const line = raw.split(/\r?\n/).find((l) => l.startsWith('FIREBASE_SERVICE_ACCOUNT='))
    if (!line) throw new Error('FIREBASE_SERVICE_ACCOUNT não encontrado em .env.local')
    value = line.slice('FIREBASE_SERVICE_ACCOUNT='.length).trim()
  }

  const trimmed = value.trim()
  const attempts = [
    () => JSON.parse(trimmed),
    () => {
      const s = JSON.parse(trimmed)
      if (typeof s !== 'string') return s
      return JSON.parse(escapeNewlinesInsideJsonStrings(s))
    },
    () => {
      const cands = [trimmed]
      if (trimmed.includes('\\"')) cands.push(trimmed.replace(/\\"/g, '"'))
      for (const c of cands) {
        try {
          return JSON.parse(escapeNewlinesInsideJsonStrings(c))
        } catch {
          /* próximo */
        }
      }
      throw new Error('fallback')
    },
  ]

  for (const attempt of attempts) {
    try {
      const parsed = attempt()
      if (parsed && typeof parsed === 'object' && parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
        return parsed
      }
    } catch {
      // tenta a próxima estratégia
    }
  }
  throw new Error('Não foi possível parsear FIREBASE_SERVICE_ACCOUNT')
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100
}

// Tabela canônica copiada de backend/src/services/service-pricing.service.js (pricingTable).
// Formato: categoria → serviço → [clientPrice, providerValue].
const PRICING = {
  'Elétrica': {
    'Instalação de lâmpadas': [110.0, 55.0],
    'Instalação de tomada': [110.0, 55.0],
    'Troca de disjuntor': [150.0, 75.0],
    'Instalação de interruptor': [110.0, 55.0],
    'Instalação de chuveiro': [150.0, 75.0],
    'Instalação de resistência': [110.0, 55.0],
    'Instalação de luminária': [150.0, 75.0],
    'Instalação de spots': [110.0, 55.0],
    'Revisão Elétrica (até 7 pontos)': [200.0, 100.0],
  },
  'Encanador': {
    'Troca de torneira': [160.0, 80.0],
    'Troca de rabicho': [160.0, 80.0],
    'Troca de sifão': [110.0, 55.0],
    'Troca de Filtro': [160.0, 80.0],
    'Troca de reparos de registro': [160.0, 80.0],
    'Troca de reparos de torneira': [160.0, 80.0],
    'Troca kit de caixa acoplada': [160.0, 80.0],
    'Reparos de descarga de parede': [160.0, 80.0],
    'Revisão hidráulica (até 7 pontos)': [160.0, 80.0],
    'Vazamentos': [120.0, 60.0],
    'Troca de torneira monobloco': [260.0, 130.0],
  },
  'Instalação': {
    'Instalação de Suporte de tv': [160.0, 80.0],
    'Instalação de ventilador de teto': [190.0, 95.0],
    'Instalação de máquina de lavar': [190.0, 95.0],
    'Instalação de Lava louça': [190.0, 95.0],
    'Instalação de Fogão Cooktop': [180.0, 90.0],
    'Instalação de Purificador': [160.0, 80.0],
    'Conversão de gás para fogão cooktop': [130.0, 65.0],
    'Varal de teto': [150.0, 75.0],
  },
  "Caixa d'água": {
    "Limpeza de caixa d'água de 1000 litros": [150.0, 75.0],
    "Limpeza de caixa d'água de 2000 litros": [250.0, 125.0],
    "Limpeza de caixa d'água de 3000 litros": [350.0, 175.0],
    "Limpeza de caixa d'água de 4000 litros": [450.0, 225.0],
    "Limpeza de caixa d'água de 5000 litros": [550.0, 275.0],
    'Troca de boia': [150.0, 75.0],
  },
  'Desentupimento manual': {
    'Desentupimento de pia': [180.0, 90.0],
    'Desentupimento ralo': [180.0, 90.0],
    'Desentupimento vaso': [180.0, 90.0],
  },
  'Desentupimento com maquinário': {
    'Até 2 metros': [200.0, 100.0],
    'Adicional por Metro': [90.0, 45.0],
  },
  'Caça-vazamentos': {
    'Caça-vazamentos': [550.0, 385.0],
  },
  'Limpeza de estofados': {
    'Limpeza de sofá 2 lugares': [215.0, 129.0],
    'Limpeza de sofá 3 lugares': [265.0, 159.0],
    'Limpeza de sofá retrátil': [265.0, 159.0],
    'Limpeza de sofá de canto': [265.0, 159.0],
    'Limpeza de poltronas estofadas': [195.0, 117.0],
    'Limpeza de tapetes pequenos (até 2 mts)': [215.0, 129.0],
    'Limpeza de cadeiras estofadas': [195.0, 117.0],
    'Limpeza de carpetes pequenos (até 2mts)': [215.0, 129.0],
    'Higienização de colchões Casal': [215.0, 129.0],
    'Colchão solteiro': [145.0, 87.0],
    'Colchão king': [315.0, 189.0],
    'Colchão queen': [265.0, 159.0],
    'Impermeabilização': [65.0, 39.0],
  },
  'Eletrodomésticos': {
    'Conserto de micro-ondas': [160.0, 80.0],
    'Reparo de fogão e forno': [160.0, 80.0],
    'Reparo de pequenos eletrodomésticos': [160.0, 80.0],
    'Instalação de eletrodomésticos': [190.0, 95.0],
    'Geladeira e freezer': [250.0, 125.0],
    'Máquina de lavar': [180.0, 90.0],
  },
  'Chaveiro residencial': {
    'Abertura de portas residencial': [180.0, 108.0],
    'Ajuste de fechaduras': [180.0, 108.0],
    'Instalação de fechadura eletrônica e digital': [280.0, 168.0],
    'Extração de chave': [150.0, 90.0],
  },
  'Serviços automotivos': {
    'Abertura de portas de veículos': [180.0, 90.0],
    'Extração de chaves quebradas': [180.0, 90.0],
    'Remendo de pneu': [80.0, 40.0],
    'Remendo de pneu Caminhonete, SUV e vans': [115.0, 57.5],
    'Troca de pneu no local': [85.0, 42.5],
    'Troca de pneu Caminhonete, SUV e vans': [115.0, 57.5],
    'Pane seca (entrega de combustível)': [85.0, 42.5],
    'Partida elétrica': [120.0, 60.0],
  },
  'Montagem de móveis': {
    'Guarda roupas': [0.0, 100.0],
    'Cama': [0.0, 90.0],
    'Mesa': [0.0, 75.0],
    'Cômoda': [0.0, 75.0],
    'Armário': [0.0, 75.0],
    'Escrivaninha': [0.0, 75.0],
    'Prateleiras': [0.0, 65.0],
    'Objetos de cozinha': [0.0, 65.0],
    'Objetos de banheiro': [0.0, 65.0],
  },
  'Faxina': {
    'Faxina Básica (apt pequeno 1 a 2 quartos) - 4h a 5h': [190.0, 133.0],
    'Faxina completa (apt/casa média 2 a 3 quartos) - 6h a 8h': [250.0, 175.0],
    'Faxina pesada (casa grande, pós-obra, mudança) - 10h': [450.0, 315.0],
  },
  'Ar condicionado': {
    '9 a 12 mil BTUs split': [650.0, 364.0],
    '18 a 30 mil BTUs': [750.0, 420.0],
    'Ar de janela': [220.0, 123.2],
    'Higienização de 9 a 30 mil BTUs': [300.0, 168.0],
  },
}

// Reconciliação de nome de nicho: a tabela usa o nome curto, mas o app/service_categories
// envia o nome canônico. Semeie sob o nome que o app realmente envia (where niche == ...).
const NICHE_NAME_REMAP = {
  'Desentupimento com maquinário': 'Desentupimento com maquinário até 2 m',
}

function deriveClientPriceFromProvider(providerValue) {
  const v = Number(providerValue)
  if (!Number.isFinite(v) || v <= 0) return 0
  return round2(v * 2)
}

async function main() {
  const serviceAccount = loadServiceAccount()
  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }
  const db = admin.firestore()

  let created = 0
  let updated = 0
  let total = 0

  // Conjunto de ids já existentes para distinguir criado x atualizado.
  const existing = new Set()
  const existingSnap = await db.collection('catalog_services').get()
  existingSnap.forEach((doc) => existing.add(doc.id))

  for (const [rawCategory, services] of Object.entries(PRICING)) {
    const niche = NICHE_NAME_REMAP[rawCategory] || rawCategory
    const nicheSlug = slugify(niche)
    let order = 0

    for (const [serviceName, pair] of Object.entries(services)) {
      total++
      order++
      const clientPrice = Number(pair[0]) || 0
      const providerValue = Number(pair[1]) || 0

      const isConsult = clientPrice <= 0 && providerValue <= 0
      const estimatedPrice = isConsult
        ? 0
        : (clientPrice > 0 ? round2(clientPrice) : deriveClientPriceFromProvider(providerValue))
      const percent = estimatedPrice > 0 ? Math.round((providerValue / estimatedPrice) * 100) : 0
      const providerCommission = round2((estimatedPrice * percent) / 100)

      const slug = slugify(serviceName)
      const id = `${nicheSlug}__${slug}`

      const payload = {
        niche,
        nicheSlug,
        name: serviceName,
        title: serviceName,
        label: serviceName,
        slug,
        description: '',
        estimatedTime: '',
        estimatedPrice,
        providerCommissionPercent: percent,
        providerCommission,
        isConsult,
        active: true,
        isActive: true,
        enabled: true,
        displayOrder: order,
        order,
        sortOrder: order,
        updatedAt: admin.firestore.Timestamp.now(),
      }

      const isNew = !existing.has(id)
      const docPayload = isNew ? { ...payload, createdAt: admin.firestore.Timestamp.now() } : payload
      // eslint-disable-next-line no-await-in-loop
      await db.collection('catalog_services').doc(id).set(docPayload, { merge: true })

      if (isNew) {
        created++
        console.log(`+ ${niche} › ${serviceName}  R$${estimatedPrice} | ${percent}% → R$${providerCommission}`)
      } else {
        updated++
        console.log(`~ ${niche} › ${serviceName}  R$${estimatedPrice} | ${percent}% → R$${providerCommission}`)
      }
    }
  }

  console.log(`\nConcluído. Criados: ${created}, Atualizados: ${updated}, Total serviços: ${total}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Erro ao semear serviços do catálogo:', err)
  process.exit(1)
})
