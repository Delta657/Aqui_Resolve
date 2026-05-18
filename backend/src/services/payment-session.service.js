const HttpError = require('../utils/http-error');
const { initializeFirebase } = require('../config/firebase');

const PAYMENT_SESSIONS_COLLECTION = 'payment_sessions';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getSessionsCollection() {
  const admin = initializeFirebase();
  return admin.firestore().collection(PAYMENT_SESSIONS_COLLECTION);
}

async function savePaymentSession({ gatewayOrderId, uid, localOrderCode, paymentSource }) {
  const normalizedGatewayOrderId = normalizeString(gatewayOrderId);
  const normalizedUid = normalizeString(uid);

  if (!normalizedGatewayOrderId || !normalizedUid) {
    return null;
  }

  const admin = initializeFirebase();
  const sessionData = {
    gatewayOrderId: normalizedGatewayOrderId,
    uid: normalizedUid,
    localOrderCode: normalizeString(localOrderCode),
    paymentSource: normalizeString(paymentSource),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await getSessionsCollection()
    .doc(normalizedGatewayOrderId)
    .set(sessionData, { merge: true });

  return {
    gatewayOrderId: normalizedGatewayOrderId,
    uid: normalizedUid,
    localOrderCode: sessionData.localOrderCode,
    paymentSource: sessionData.paymentSource
  };
}

async function getPaymentSession(gatewayOrderId) {
  const normalizedGatewayOrderId = normalizeString(gatewayOrderId);
  if (!normalizedGatewayOrderId) {
    throw new HttpError(400, 'orderId invalido', {
      code: 'INVALID_ORDER_ID'
    });
  }

  const sessionSnapshot = await getSessionsCollection().doc(normalizedGatewayOrderId).get();
  if (!sessionSnapshot.exists) {
    throw new HttpError(404, 'Transacao de pagamento nao encontrada', {
      code: 'PAYMENT_SESSION_NOT_FOUND'
    });
  }

  return sessionSnapshot.data() || {};
}

async function updatePaymentSessionStatus({ gatewayOrderId, paymentStatus, gatewayStatus }) {
  const normalizedGatewayOrderId = normalizeString(gatewayOrderId);
  if (!normalizedGatewayOrderId) return;

  const admin = initializeFirebase();
  await getSessionsCollection()
    .doc(normalizedGatewayOrderId)
    .set(
      {
        paymentStatus: normalizeString(paymentStatus),
        gatewayStatus: normalizeString(gatewayStatus),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
}

async function ensurePaymentSessionOwnership({ gatewayOrderId, uid }) {
  const normalizedUid = normalizeString(uid);

  if (!normalizedUid) {
    throw new HttpError(401, 'Usuario nao autenticado', {
      code: 'UNAUTHORIZED'
    });
  }

  const sessionData = await getPaymentSession(gatewayOrderId);
  if (normalizeString(sessionData.uid) !== normalizedUid) {
    throw new HttpError(403, 'Voce nao tem acesso a esta transacao de pagamento', {
      code: 'FORBIDDEN_PAYMENT_SESSION'
    });
  }

  return sessionData;
}

module.exports = {
  ensurePaymentSessionOwnership,
  getPaymentSession,
  savePaymentSession,
  updatePaymentSessionStatus
};