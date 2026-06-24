// QA — smoke-test de todas as páginas do sidebar do painel admin num Chrome real.
// Uso (de dentro de dashboard_admin/, com o dev server no :3000 e o QA admin criado):
//   export NODE_PATH=/home/acer/simcar-auto/node_modules   # onde houver playwright-core
//   node scripts/qa-smoke.mjs
// Requer: dev server em http://localhost:3000 + scripts/qa-temp-admin.mjs create já rodado.
// Lê a lista de páginas reais do sidebar (components/layout/sidebar.tsx). Captura por página:
// erros de console, pageerror, respostas HTTP >=400 e error boundaries visíveis.
import { chromium } from 'playwright-core'

const BASE = process.env.QA_BASE || 'http://localhost:3000'
const EMAIL = 'qa.full.admin@aquiresolve.com', PASS = 'QaFull123456!'

// Páginas reais (espelha components/layout/sidebar.tsx). Atualize se a navegação mudar.
const PAGES = [
  ['painel', '/dashboard'],
  ['servicos-visao', '/dashboard/servicos'],
  ['catalogo-app', '/dashboard/servicos/catalogo-app'],
  ['combos', '/dashboard/servicos/combos'],
  ['monitor-chat', '/dashboard/controle/chat'],
  ['monitoramento', '/dashboard/controle/monitoramento'],
  ['central-operacional', '/dashboard/controle/chat-operacional'],
  ['chat-clientes', '/dashboard/controle/chat-clientes'],
  ['chat-prestadores', '/dashboard/controle/chat-prestadores'],
  ['aceitacao-prestadores', '/dashboard/controle/aceitacao-prestadores'],
  ['especialidades', '/dashboard/controle/especialidades'],
  ['users-clients', '/users/clients'],
  ['users-providers', '/users/providers'],
  ['classificacao', '/users/classificacao-prestadores'],
  ['orders', '/orders'],
  ['financeiro', '/dashboard/financeiro'],
  ['faturamento', '/dashboard/financeiro/faturamento'],
  ['reports', '/reports'],
  ['config-geral', '/dashboard/configuracoes'],
  ['banners', '/dashboard/configuracoes/banners'],
  ['parceiros', '/dashboard/configuracoes/parceiros'],
  ['aquicash', '/dashboard/configuracoes/aquicash'],
  ['guincho', '/dashboard/configuracoes/guincho'],
  ['manual', '/dashboard/manual'],
  ['master', '/master'],
]

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] })
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage()
const report = {}
let cur = 'login'
const push = (k, v) => { (report[cur] ??= { console: [], pageerror: [], http: [] })[k].push(v) }
page.on('console', m => { if (m.type() === 'error') push('console', m.text().slice(0, 300)) })
page.on('pageerror', e => push('pageerror', (e.message || String(e)).slice(0, 300)))
page.on('response', r => { const u = r.url(); if (r.status() >= 400 && u.includes('/api/')) push('http', `${r.status()} ${u.replace(BASE, '')}`) })

try {
  report[cur] = { console: [], pageerror: [], http: [] }
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector('input[type="email"]', { timeout: 30000 })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASS)
  await Promise.all([page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => {}), page.click('button[type="submit"]')])
  await page.waitForTimeout(4000)
  console.log('LOGIN url:', page.url())
  for (const [name, path] of PAGES) {
    cur = name
    report[cur] = { console: [], pageerror: [], http: [] }
    try {
      const resp = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForTimeout(3500)
      report[cur].status = resp ? resp.status() : '?'
      report[cur].errBoundary = await page.locator('text=/Application error|Unhandled Runtime Error|client-side exception|Erro ao carregar/i').count().catch(() => 0)
    } catch (e) { report[cur].nav = 'NAV_FAIL: ' + (e.message || e).slice(0, 200) }
  }
} catch (e) { console.error('FATAL', e.message) } finally { await browser.close() }

console.log('\n========== SMOKE REPORT ==========')
let warn = 0
for (const [k, v] of Object.entries(report)) {
  const u = a => [...new Set(a)]
  const issues = []
  if (v.nav) issues.push(v.nav)
  if (v.errBoundary) issues.push('ERROR_BOUNDARY visible')
  if (v.status && v.status >= 400) issues.push('page status ' + v.status)
  if (v.pageerror?.length) issues.push('pageerror: ' + u(v.pageerror).join(' | '))
  if (v.http?.length) issues.push('http: ' + u(v.http).join(' , '))
  if (v.console?.length) issues.push('console: ' + u(v.console).slice(0, 4).join(' | '))
  if (issues.length) warn++
  console.log(`\n[${k}] ${issues.length ? '⚠️' : '✓ ok'}`)
  issues.forEach(i => console.log('   - ' + i))
}
console.log(`\n${warn} página(s) com avisos. Lembre: "Failed to fetch" pós-navegação costuma ser aborto, não bug — confirme com dwell isolado.`)
