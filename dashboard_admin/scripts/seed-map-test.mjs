// Seed de dados de teste para validar o mini-mapa do prestador.
// Cria: Auth user do prestador, users/{uid} (userType=provider),
// providers/{uid} (verificationStatus=verified) e um pedido assigned+pago
// com coordinates do cliente. Idempotente.
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const sa = JSON.parse(readFileSync('/tmp/sa_fb.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const auth = admin.auth();

const PROVIDER_EMAIL = 'prestador.teste@aquiresolve.com';
const PROVIDER_PASSWORD = 'Prestador123456!';
const PROVIDER_NAME = 'Prestador Teste';

const CLIENT_UID = 'e8CqXDEthiRMadtlhmJtF1HBbZD2';
const CLIENT_NAME = 'Cliente Teste';

// Local do cliente (serviço): Cuiabá-MT, centro
const CLIENT_LAT = -15.5989;
const CLIENT_LNG = -56.0949;

const ORDER_ID = 'TEST_MAP_ORDER_001';

async function ensureProvider() {
  let user;
  try {
    user = await auth.getUserByEmail(PROVIDER_EMAIL);
    await auth.updateUser(user.uid, { password: PROVIDER_PASSWORD, displayName: PROVIDER_NAME });
    console.log('Auth prestador existente, senha atualizada:', user.uid);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      user = await auth.createUser({ email: PROVIDER_EMAIL, password: PROVIDER_PASSWORD, displayName: PROVIDER_NAME });
      console.log('Auth prestador criado:', user.uid);
    } else throw e;
  }
  return user.uid;
}

async function main() {
  const providerUid = await ensureProvider();
  const now = admin.firestore.Timestamp.now();

  // users/{uid} -> userType provider (roteia para ProviderHomeActivity)
  await db.collection('users').doc(providerUid).set({
    name: PROVIDER_NAME,
    email: PROVIDER_EMAIL,
    userType: 'provider',
    phone: '65999990000',
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  // providers/{uid} -> verificationStatus verified (APPROVED) p/ ver pedidos
  await db.collection('providers').doc(providerUid).set({
    name: PROVIDER_NAME,
    email: PROVIDER_EMAIL,
    verificationStatus: 'verified',
    providerBalance: 0,
    providerTotalEarned: 0,
    serviceCategories: ['Elétrica', 'Hidráulica', 'Limpeza'],
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  // Pedido assigned + pago, atribuído ao prestador, com coordenadas do cliente
  await db.collection('orders').doc(ORDER_ID).set({
    id: ORDER_ID,
    protocol: 'AR-TEST-MAP-001',
    clientId: CLIENT_UID,
    clientName: CLIENT_NAME,
    clientEmail: 'cliente.teste@aquiresolve.com',
    clientPhone: '65988887777',
    serviceType: 'Instalação de tomada',
    serviceName: 'Instalação de tomada',
    description: 'Pedido de teste para validar o mini-mapa do prestador.',
    priority: 'normal',
    address: 'Av. Historiador Rubens de Mendonça, 1856 - Cuiabá/MT',
    city: 'Cuiabá',
    state: 'MT',
    zipCode: '78050-000',
    coordinates: new admin.firestore.GeoPoint(CLIENT_LAT, CLIENT_LNG),
    status: 'assigned',
    assignedProvider: providerUid,
    assignedProviderName: PROVIDER_NAME,
    assignedAt: now,
    paymentStatus: 'paid',
    transactionId: 'test_tx_map_001',
    estimatedPrice: 120.0,
    providerCommission: 60.0,
    distributionStartedAt: now,
    confirmedAt: now,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  console.log('OK pedido', ORDER_ID, 'assigned ->', providerUid);
  console.log('Cliente coords:', CLIENT_LAT, CLIENT_LNG);
  console.log('PROVIDER_UID=' + providerUid);
  process.exit(0);
}

main().catch((e) => { console.error('ERRO', e); process.exit(1); });
