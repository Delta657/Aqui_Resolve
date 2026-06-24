// QA — cria/remove um admin temporário com TODAS as permissões para testar o painel no navegador.
// Uso (de dentro de dashboard_admin/, Node >=20):
//   GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa_fb.json node scripts/qa-temp-admin.mjs create
//   GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa_fb.json node scripts/qa-temp-admin.mjs remove
// Decodifique a service account para /tmp/sa_fb.json com o extrator da skill aquiresolve-firebase.
// SEMPRE rode `remove` ao terminar (segurança).
import admin from 'firebase-admin'

const EMAIL = 'qa.full.admin@aquiresolve.com'
const PASS = 'QaFull123456!'
const PERMISSION_KEYS = [
  'dashboard', 'controle', 'gestaoUsuarios', 'gestaoPedidos', 'financeiro', 'relatorios',
  'configuracoes', 'visualizarBanners', 'criarBanners', 'editarBanners', 'publicarBanners',
  'excluirBanners', 'gerenciarCatalogo', 'gerenciarCombos', 'gerenciarParceiros',
  'gerenciarAquicash', 'gerenciarGuincho', 'enviarNotificacoes', 'aprovarPrestadores',
  'administrarUsuarios', 'operarPedidos', 'operarFinanceiro', 'gerenciarAdministradores',
]

admin.initializeApp({ credential: admin.credential.applicationDefault() })
const auth = admin.auth(), db = admin.firestore()
const action = process.argv[2] || 'create'

async function userDocRef(uid) {
  return db.collection('adminmaster').doc('master').collection('usuarios').doc(uid)
}

async function create() {
  let u
  try { u = await auth.getUserByEmail(EMAIL); await auth.updateUser(u.uid, { password: PASS, disabled: false }) }
  catch { u = await auth.createUser({ email: EMAIL, password: PASS, displayName: 'QA Full Admin' }) }
  const perms = Object.fromEntries(PERMISSION_KEYS.map(k => [k, true]))
  await (await userDocRef(u.uid)).set({
    email: EMAIL, nome: 'QA Full Admin', ativo: true, active: true, permissoes: perms,
    criadoEm: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })
  console.log('QA admin criado:', EMAIL, 'uid', u.uid)
}

async function remove() {
  try {
    const u = await auth.getUserByEmail(EMAIL)
    await (await userDocRef(u.uid)).delete().catch(() => {})
    await auth.deleteUser(u.uid)
    console.log('QA admin removido:', EMAIL)
  } catch (e) {
    console.log('QA admin já não existe.', e.message)
  }
}

;(action === 'remove' ? remove() : create())
  .then(() => process.exit(0))
  .catch(e => { console.error('ERRO:', e.message); process.exit(1) })
