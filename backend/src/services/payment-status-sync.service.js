const HttpError = require('../utils/http-error');
const { initializeFirebase } = require('../config/firebase');
const logger = require('../utils/logger');

const ORDER_STATUS_AWAITING_PAYMENT = 'awaiting_payment';
const ORDER_STATUS_DISTRIBUTING = 'distributing';
const PAYMENT_STATUS_PAID = 'paid';
const PAYMENT_STATUS_PENDING = 'pending';
const PAYMENT_STATUS_FAILED = 'failed';
const PAYMENT_STATUS_CANCELED = 'canceled';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeLower(value) {
  return normalizeString(value).toLowerCase();
}

function isCartCheckout(localOrderCode, paymentSource) {
  const code = normalizeString(localOrderCode);
  return paymentSource === 'prepared_cart_checkout' || code === 'cart_checkout' || code.startsWith('cart_checkout_');
}

function collectGatewayStatuses(order) {
  const statuses = [];

  const addStatus = (value) => {
    const normalized = normalizeLower(value);
    if (normalized) statuses.push(normalized);
  };

  addStatus(order && order.status);

  const charges = Array.isArray(order && order.charges) ? order.charges : [];
  charges.forEach((charge) => {
    addStatus(charge && charge.status);
    addStatus(charge && charge.last_transaction && charge.last_transaction.status);
    addStatus(charge && charge.lastTransaction && charge.lastTransaction.status);
  });

  addStatus(order && order.last_transaction && order.last_transaction.status);
  addStatus(order && order.lastTransaction && order.lastTransaction.status);

  return statuses;
}

function derivePaymentStatus(order) {
  const statuses = collectGatewayStatuses(order);

  if (statuses.includes('paid') || statuses.includes('captured')) {
    return PAYMENT_STATUS_PAID;
  }

  if (
    statuses.includes('canceled') ||
    statuses.includes('cancelled') ||
    statuses.includes('voided') ||
    statuses.includes('refused') ||
    statuses.includes('failed') ||
    statuses.includes('chargeback') ||
    statuses.includes('chargedback')
  ) {
    return statuses.includes('canceled') || statuses.includes('cancelled') || statuses.includes('voided')
      ? PAYMENT_STATUS_CANCELED
      : PAYMENT_STATUS_FAILED;
  }

  return PAYMENT_STATUS_PENDING;
}

function buildOrderPaymentUpdate({ gatewayOrder, paymentStatus, admin }) {
  const firestore = admin.firestore;
  const now = firestore.FieldValue.serverTimestamp();
  const update = {
    paymentStatus,
    transactionId: normalizeString(gatewayOrder && gatewayOrder.id),
    gatewayOrderId: normalizeString(gatewayOrder && gatewayOrder.id),
    gatewayStatus: normalizeString(gatewayOrder && gatewayOrder.status),
    paymentConfirmedBy: 'backend',
    paymentSyncedAt: now,
    updatedAt: now
  };

  if (paymentStatus === PAYMENT_STATUS_PAID) {
    update.status = ORDER_STATUS_DISTRIBUTING;
    update.confirmedAt = now;
  } else {
    update.status = ORDER_STATUS_AWAITING_PAYMENT;
    update.confirmedAt = firestore.FieldValue.delete();
  }

  return update;
}

async function deleteCartItemsForOrders({ firestore, uid, orderDocs, batch }) {
  const normalizedUid = normalizeString(uid);
  if (!normalizedUid) return;

  orderDocs.forEach((doc) => {
    const data = doc.data() || {};
    const cartItemId = normalizeString(data.cartItemId);
    if (!cartItemId) return;

    const cartItemRef = firestore
      .collection('carts')
      .doc(normalizedUid)
      .collection('items')
      .doc(cartItemId);
    batch.delete(cartItemRef);
  });
}

async function syncSingleOrder({ firestore, admin, gatewayOrder, session, paymentStatus }) {
  const localOrderCode = normalizeString(session && session.localOrderCode);
  if (!localOrderCode) {
    throw new HttpError(422, 'Sessao de pagamento sem pedido local associado', {
      code: 'PAYMENT_SESSION_MISSING_LOCAL_ORDER'
    });
  }

  const orderRef = firestore.collection('orders').doc(localOrderCode);
  const snapshot = await orderRef.get();
  if (!snapshot.exists) {
    throw new HttpError(404, 'Pedido local nao encontrado para sincronizar pagamento', {
      code: 'LOCAL_ORDER_NOT_FOUND'
    });
  }

  const order = snapshot.data() || {};
  if (normalizeString(order.clientId) !== normalizeString(session.uid)) {
    throw new HttpError(403, 'Sessao de pagamento nao pertence ao cliente do pedido', {
      code: 'PAYMENT_SESSION_ORDER_OWNER_MISMATCH'
    });
  }

  await orderRef.update(buildOrderPaymentUpdate({ gatewayOrder, paymentStatus, admin }));
  return { updatedOrders: 1, deletedCartItems: 0 };
}

async function syncCartCheckout({ firestore, admin, gatewayOrder, session, paymentStatus }) {
  const checkoutCode = normalizeString(session && session.localOrderCode);
  const uid = normalizeString(session && session.uid);
  if (!checkoutCode || !uid) {
    throw new HttpError(422, 'Sessao de carrinho incompleta para sincronizar pagamento', {
      code: 'PAYMENT_SESSION_CART_INCOMPLETE'
    });
  }

  const snapshot = await firestore
    .collection('orders')
    .where('cartCheckoutCode', '==', checkoutCode)
    .where('clientId', '==', uid)
    .get();

  if (snapshot.empty) {
    throw new HttpError(404, 'Pedidos do carrinho nao encontrados para sincronizar pagamento', {
      code: 'CART_ORDERS_NOT_FOUND'
    });
  }

  const batch = firestore.batch();
  const update = buildOrderPaymentUpdate({ gatewayOrder, paymentStatus, admin });
  snapshot.docs.forEach((doc) => batch.update(doc.ref, update));

  // A partir do momento que uma transacao foi criada (pending ou paid), os itens saem do carrinho
  // para evitar novo checkout duplicado. Os pedidos aguardam webhook/polling para virar distributing.
  await deleteCartItemsForOrders({ firestore, uid, orderDocs: snapshot.docs, batch });

  await batch.commit();
  return { updatedOrders: snapshot.size, deletedCartItems: snapshot.docs.length };
}

async function syncPaymentStatusToFirestore({ gatewayOrder, session }) {
  const gatewayOrderId = normalizeString(gatewayOrder && gatewayOrder.id);
  if (!gatewayOrderId) {
    throw new HttpError(400, 'Pedido do gateway sem identificador', {
      code: 'INVALID_GATEWAY_ORDER'
    });
  }

  if (!session || typeof session !== 'object') {
    throw new HttpError(404, 'Sessao de pagamento nao encontrada para sincronizacao', {
      code: 'PAYMENT_SESSION_NOT_FOUND'
    });
  }

  const admin = initializeFirebase();
  const firestore = admin.firestore();
  const paymentStatus = derivePaymentStatus(gatewayOrder);

  const result = isCartCheckout(session.localOrderCode, session.paymentSource)
    ? await syncCartCheckout({ firestore, admin, gatewayOrder, session, paymentStatus })
    : await syncSingleOrder({ firestore, admin, gatewayOrder, session, paymentStatus });

  logger.info('Status de pagamento sincronizado no Firestore pelo backend', {
    gatewayOrderId,
    localOrderCode: normalizeString(session.localOrderCode),
    paymentSource: normalizeString(session.paymentSource),
    paymentStatus,
    updatedOrders: result.updatedOrders,
    deletedCartItems: result.deletedCartItems
  });

  return {
    gatewayOrderId,
    paymentStatus,
    ...result
  };
}

module.exports = {
  derivePaymentStatus,
  syncPaymentStatusToFirestore
};
