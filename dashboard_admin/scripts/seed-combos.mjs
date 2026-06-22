// Semeia combos de teste na coleção `home_combos` (vitrine de Combos Promocionais da Home).
// Escolhe serviços REAIS do catálogo (catalog_services) cujos nichos disparam os descontos do
// PromotionManager, e usa os percentuais REAIS de app_config/cashback — assim o valor anunciado
// bate com o que o carrinho cobra. Idempotente: ids determinísticos + merge.
//   Rode de dentro de `dashboard_admin/` com Node >= 20:  node scripts/seed-combos.mjs
import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'

function esc(v) {
  let f = '', i = false, e = false
  for (const c of v) {
    if (e) { f += c; e = false }
    else if (c === '\\' && i) { f += c; e = true }
    else if (c === '"') { i = !i; f += c }
    else if (c === '\n' && i) { f += '\\n' }
    else { f += c }
  }
  return f
}

function loadServiceAccount() {
  const raw = readFileSync('.env.local', 'utf8')
  const line = raw.split(/\r?\n/).find((l) => l.startsWith('FIREBASE_SERVICE_ACCOUNT='))
  if (!line) throw new Error('FIREBASE_SERVICE_ACCOUNT ausente em .env.local')
  const v = line.slice('FIREBASE_SERVICE_ACCOUNT='.length).trim()
  const attempts = [
    () => JSON.parse(v),
    () => { const s = JSON.parse(v); return typeof s === 'string' ? JSON.parse(esc(s)) : s },
    () => { let c = v; if (v.includes('\\"')) c = v.replace(/\\"/g, '"'); return JSON.parse(esc(c)) },
  ]
  for (const a of attempts) {
    try {
      const p = a()
      if (p && p.private_key) { p.private_key = p.private_key.replace(/\\n/g, '\n'); return p }
    } catch { /* tenta o próximo */ }
  }
  throw new Error('Não foi possível decodificar FIREBASE_SERVICE_ACCOUNT')
}

// Grupos do PromotionManager (mesmos nomes de nicho usados no app).
const HIDRAULICA = ['Encanador', 'Hidráulica', "Caixa d'água", 'Desentupimento manual',
  'Desentupimento com maquinário até 2 m', 'Caça-vazamentos']
const INSTALACOES = ['Instalação', 'Eletrodomésticos', 'Ar condicionado']

function round2(n) { return Math.round(n * 100) / 100 }

async function main() {
  admin.initializeApp({ credential: admin.credential.cert(loadServiceAccount()) })
  const db = admin.firestore()

  // 1. Carrega catálogo e configura percentuais reais.
  const svcSnap = await db.collection('catalog_services').get()
  const services = svcSnap.docs
    .map((d) => {
      const x = d.data()
      return {
        id: d.id,
        niche: String(x.niche ?? ''),
        name: String(x.name ?? x.title ?? x.label ?? ''),
        price: Number(x.estimatedPrice ?? 0),
        active: (x.active ?? x.isActive ?? x.enabled) !== false,
        isConsult: x.isConsult === true,
      }
    })
    .filter((s) => s.active && s.name && s.niche && !s.isConsult && s.price > 0)

  const cfgSnap = await db.collection('app_config').doc('cashback').get()
  const cfg = cfgSnap.exists ? cfgSnap.data() : {}
  const pctEleHid = Number(cfg.comboEletricaHidraulica ?? 10) || 10
  const pctInstHid = Number(cfg.comboInstalacoesHidraulica ?? 10) || 10
  const pctTriple = Number(cfg.comboEletricaHidraulicaInstalacoes ?? 15) || 15

  const pick = (niches) => services.find((s) => niches.some((n) => n.toLowerCase() === s.niche.toLowerCase()))
  const eletrica = pick(['Elétrica'])
  const hidraulica = pick(HIDRAULICA)
  const instalacao = pick(INSTALACOES)

  if (!eletrica || !hidraulica || !instalacao) {
    console.error('Catálogo insuficiente para semear combos (faltou Elétrica/Hidráulica/Instalação).')
    console.error('Encontrados:', { eletrica: eletrica?.name, hidraulica: hidraulica?.name, instalacao: instalacao?.name })
    process.exit(1)
  }

  const toItem = (s) => ({ niche: s.niche, serviceName: s.name, serviceId: s.id })
  const buildCombo = (id, name, description, items, discountPercent, displayOrder) => {
    const fullPrice = round2(items.reduce((sum, s) => sum + s.price, 0))
    const promoPrice = round2(fullPrice * (1 - discountPercent / 100))
    const savings = round2(fullPrice - promoPrice)
    return {
      id,
      doc: {
        name, description,
        imageUrl: `https://picsum.photos/seed/${id}/1200/600`,
        items: items.map(toItem),
        fullPrice, promoPrice, savings, discountPercent,
        active: true, displayOrder,
        isActive: true, enabled: true, order: displayOrder, sortOrder: displayOrder,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    }
  }

  const combos = [
    buildCombo('seed-casa-nova', 'Combo Casa Nova',
      `${eletrica.name} + ${hidraulica.name} + ${instalacao.name}`,
      [eletrica, hidraulica, instalacao], pctTriple, 0),
    buildCombo('seed-ele-hid', 'Combo Elétrica + Hidráulica',
      `${eletrica.name} + ${hidraulica.name}`,
      [eletrica, hidraulica], pctEleHid, 1),
    buildCombo('seed-inst-hid', 'Combo Reforma Rápida',
      `${instalacao.name} + ${hidraulica.name}`,
      [instalacao, hidraulica], pctInstHid, 2),
  ]

  for (const c of combos) {
    await db.collection('home_combos').doc(c.id).set(c.doc, { merge: true })
    console.log(`✔ ${c.doc.name}: ${c.doc.items.length} itens · ${c.doc.discountPercent}% · de R$${c.doc.fullPrice} por R$${c.doc.promoPrice}`)
  }

  console.log(`\nSemeados ${combos.length} combos em home_combos.`)
  process.exit(0)
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1) })
