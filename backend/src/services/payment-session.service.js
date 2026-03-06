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
    return;
  }

  const admin = initializeFirebase();
  await getSessionsCollection()
    .document(normalizedGatewayOrderId)
    .set(
      {
        gatewayOrderId: normalizedGatewayOrderId,
        uid: normalizedUid,
        localOrderCode: normalizeString(localOrderCode),
        paymentSource: normalizeString(paymentSource),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
}

async function ensurePaymentSessionOwnership({ gatewayOrderId, uid }) {
  const normalizedGatewayOrderId = normalizeString(gatewayOrderId);
  const normalizedUid = normalizeString(uid);

  if (!normalizedGatewayOrderId) {
    throw new HttpError(400, 'orderId invalido', {
      code: 'INVALID_ORDER_ID'
    });
  }

  if (!normalizedUid) {
    throw new HttpError(401, 'Usuario nao autenticado', {
      code: 'UNAUTHORIZED'
    });
  }

  const sessionSnapshot = await getSessionsCollection().document(normalizedGatewayOrderId).get();
  if (!sessionSnapshot.exists) {
    throw new HttpError(404, 'Transacao de pagamento nao encontrada', {
      code: 'PAYMENT_SESSION_NOT_FOUND'
    });
  }

  const sessionData = sessionSnapshot.data() || {};
  if (normalizeString(sessionData.uid) !== normalizedUid) {
    throw new HttpError(403, 'Voce nao tem acesso a esta transacao de pagamento', {
      code: 'FORBIDDEN_PAYMENT_SESSION'
    });
  }

  return sessionData;
}

module.exports = {
  ensurePaymentSessionOwnership,
  savePaymentSession
};
