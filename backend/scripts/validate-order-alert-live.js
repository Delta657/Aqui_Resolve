/**
 * Validação AO VIVO do alerta de novo pedido contra o Firestore de produção.
 *
 * Não escreve nada. Para cada nicho com prestadores, aplica a MESMA lógica do
 * provider-notification.service (isProviderEligible + resolveUserFcmToken) e
 * informa quantos prestadores disponíveis com token receberiam o push — provando
 * que, quando um pedido daquele nicho vira `distributing`, o backend toca para eles.
 *
 * Uso: node scripts/validate-order-alert-live.js [nicho]
 */
const admin = require('firebase-admin');
const path = require('path');
const sa = require(path.resolve(__dirname, '../../infra-config/firebase/service-account.json'));
const { resolveUserFcmToken } = require('../src/utils/fcm-token');
const { isProviderEligible, buildOrderFcmMessage } = require('../src/utils/provider-notification-logic');

admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  const onlyNiche = process.argv[2];

  const provSnap = await db.collection('providers').get();
  console.log(`Total de prestadores: ${provSnap.size}`);

  // Agrupa por nicho (services array)
  const byNiche = new Map();
  provSnap.forEach((doc) => {
    const p = doc.data();
    const services = Array.isArray(p.services) ? p.services : [];
    services.forEach((niche) => {
      if (!byNiche.has(niche)) byNiche.set(niche, []);
      byNiche.get(niche).push({ id: doc.id, ...p });
    });
  });

  const niches = onlyNiche ? [onlyNiche] : [...byNiche.keys()];
  console.log(`Nichos com prestadores: ${[...byNiche.keys()].join(', ') || '(nenhum)'}\n`);

  let anyReachable = false;
  for (const niche of niches) {
    const providers = byNiche.get(niche) || [];
    let eligible = 0;
    let withToken = 0;
    for (const p of providers) {
      if (!isProviderEligible(p)) continue;
      eligible += 1;
      const token = await resolveUserFcmToken(db, p.id);
      if (token) withToken += 1;
    }
    const ok = withToken > 0;
    if (ok) anyReachable = true;
    console.log(
      `${ok ? '✅' : '⚠️ '} ${niche}: ${providers.length} cadastrados | ` +
      `${eligible} aprovados+disponíveis | ${withToken} com token FCM`
    );
  }

  console.log(
    anyReachable
      ? '\n✅ Há prestadores alcançáveis por push — o alerta de novo pedido toca para eles.'
      : '\n⚠️ Nenhum prestador disponível com token agora (toque depende de prestador online com token salvo).'
  );

  // DRY-RUN: valida o envio FCM real (payload data-only + tokens) SEM entregar nada
  // aos usuários (validateOnly=true). Prova que o Firebase aceita a mensagem.
  const dryNiche = onlyNiche || 'Elétrica';
  const dryProviders = (byNiche.get(dryNiche) || []);
  const dryTokens = [];
  for (const p of dryProviders) {
    if (!isProviderEligible(p)) continue;
    const t = await resolveUserFcmToken(db, p.id);
    if (t) dryTokens.push(t);
    if (dryTokens.length >= 10) break; // amostra
  }
  if (dryTokens.length > 0) {
    const msg = buildOrderFcmMessage({ id: 'DRYRUN_VALIDATION' }, dryNiche);
    const resp = await admin.messaging().sendEachForMulticast(
      { tokens: dryTokens, ...msg },
      /* dryRun */ true
    );
    console.log(
      `\n[DRY-RUN FCM] nicho="${dryNiche}" amostra=${dryTokens.length} ` +
      `→ aceitos=${resp.successCount} falhas=${resp.failureCount} (NENHUM push entregue)`
    );
    if (resp.failureCount > 0) {
      resp.responses.forEach((r, i) => {
        if (!r.success) console.log(`   token[${i}] erro: ${r.error && r.error.code}`);
      });
    }
  }
  process.exit(0);
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
