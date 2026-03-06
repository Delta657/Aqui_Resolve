const HttpError = require('../utils/http-error');
const { initializeFirebase } = require('../config/firebase');

const CART_CHECKOUT_CODE = 'cart_checkout';
const ORDER_STATUS_AWAITING_PAYMENT = 'awaiting_payment';
const ORDER_STATUS_DRAFT = 'draft';
const PAYMENT_STATUS_PAID = 'paid';
const PAYMENT_STATUS_PENDING = 'pending';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isCartCheckoutCode(orderId) {
  return orderId === CART_CHECKOUT_CODE || orderId.startsWith(`${CART_CHECKOUT_CODE}_`);
}

function normalizeLower(value) {
  return normalizeString(value).toLowerCase();
}

function toCents(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(422, 'Valor do pedido invalido para pagamento', {
      code: 'INVALID_ORDER_AMOUNT'
    });
  }

  return Math.round(amount * 100);
}

function clonePayments(payments) {
  const sanitizedPayments = Array.isArray(payments)
    ? payments
        .filter((payment) => payment && typeof payment === 'object' && !Array.isArray(payment))
        .map((payment) => ({ ...payment }))
    : [];

  if (sanitizedPayments.length === 0) {
    throw new HttpError(400, 'O campo payments e obrigatorio', {
      code: 'INVALID_PAYLOAD'
    });
  }

  return sanitizedPayments;
}

function buildMetadata(metadata, orderId, source) {
  const baseMetadata =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...metadata }
      : {};

  return {
    ...baseMetadata,
    order_id: orderId,
    payment_source: source,
    platform: normalizeString(baseMetadata.platform) || 'android'
  };
}

function sanitizeCustomer(customer, fallback = {}) {
  if (!customer || typeof customer !== 'object' || Array.isArray(customer)) {
    throw new HttpError(400, 'O campo customer e obrigatorio', {
      code: 'INVALID_PAYLOAD'
    });
  }

  const sanitizedCustomer = { ...customer };
  sanitizedCustomer.name = normalizeString(sanitizedCustomer.name) || normalizeString(fallback.name);
  sanitizedCustomer.email = normalizeString(sanitizedCustomer.email) || normalizeString(fallback.email);

  if (!sanitizedCustomer.name || !sanitizedCustomer.email) {
    throw new HttpError(422, 'Dados do cliente incompletos para o pagamento', {
      code: 'INVALID_CUSTOMER_DATA'
    });
  }

  return sanitizedCustomer;
}

function extractRequestedOrderId(payload) {
  const metadataOrderId = normalizeString(payload?.metadata?.order_id);
  const itemCode = normalizeString(payload?.items?.[0]?.code);

  if (metadataOrderId && itemCode && metadataOrderId !== itemCode) {
    throw new HttpError(400, 'Identificador do pedido inconsistente no payload', {
      code: 'INVALID_ORDER_CODE'
    });
  }

  const orderId = metadataOrderId || itemCode;
  if (!orderId) {
    throw new HttpError(400, 'Identificador do pedido ausente no payload', {
      code: 'INVALID_ORDER_CODE'
    });
  }

  return orderId;
}

function buildOrderDescription(order) {
  const serviceName = normalizeString(order?.serviceName);
  const serviceType = normalizeString(order?.serviceType);
  const parts = [serviceName, serviceType].filter(Boolean);
  return parts.join(' - ') || 'Pedido AquiResolve';
}

async function loadUserFallbackData(firestore, uid) {
  const userSnapshot = await firestore.collection('users').document(uid).get();
  if (!userSnapshot.exists) {
    return {};
  }

  const data = userSnapshot.data() || {};
  return {
    name: normalizeString(data.fullName),
    email: normalizeString(data.email)
  };
}

async function authorizeSingleOrderPayload({ firestore, payload, uid, orderId }) {
  const orderSnapshot = await firestore.collection('orders').document(orderId).get();
  if (!orderSnapshot.exists) {
    throw new HttpError(404, 'Pedido nao encontrado para pagamento', {
      code: 'ORDER_NOT_FOUND'
    });
  }

  const order = orderSnapshot.data() || {};
  if (normalizeString(order.clientId) !== uid) {
    throw new HttpError(403, 'Voce nao tem acesso a este pedido', {
      code: 'FORBIDDEN_ORDER'
    });
  }

  const orderStatus = normalizeLower(order.status);
  const paymentStatus = normalizeLower(order.paymentStatus);

  if (paymentStatus === PAYMENT_STATUS_PAID) {
    throw new HttpError(409, 'Este pedido ja foi pago', {
      code: 'ORDER_ALREADY_PAID'
    });
  }

  const canBePaid =
    (orderStatus === ORDER_STATUS_AWAITING_PAYMENT || orderStatus === ORDER_STATUS_DRAFT) &&
    (!paymentStatus ||
      paymentStatus === ORDER_STATUS_AWAITING_PAYMENT ||
      paymentStatus === PAYMENT_STATUS_PENDING);

  if (!canBePaid) {
    throw new HttpError(409, 'Pedido nao esta disponivel para um novo pagamento', {
      code: 'ORDER_PAYMENT_STATE_INVALID'
    });
  }

  return {
    items: [
      {
        amount: toCents(Number(order.finalPrice || order.estimatedPrice)),
        description: buildOrderDescription(order),
        quantity: 1,
        code: orderId
      }
    ],
    customer: sanitizeCustomer(payload.customer, {
      name: order.clientName,
      email: order.clientEmail
    }),
    payments: clonePayments(payload.payments),
    metadata: buildMetadata(payload.metadata, orderId, 'firestore_order'),
    closed: payload.closed !== false
  };
}

async function authorizeCartPayload({ firestore, payload, uid, requestedOrderId }) {
  const fallbackCustomer = await loadUserFallbackData(firestore, uid);
  const cartOrderCode =
    requestedOrderId && requestedOrderId !== CART_CHECKOUT_CODE
      ? requestedOrderId
      : `${CART_CHECKOUT_CODE}_${uid}_${Date.now()}`;
  let payableItems = [];
  let paymentSource = 'cart_checkout';

  if (requestedOrderId && requestedOrderId !== CART_CHECKOUT_CODE) {
    const checkoutOrdersSnapshot = await firestore
      .collection('orders')
      .where('cartCheckoutCode', '==', cartOrderCode)
      .get();

    payableItems = checkoutOrdersSnapshot.docs
      .map((doc) => doc.data() || {})
      .filter((order) => normalizeString(order.clientId) === uid)
      .filter((order) => normalizeLower(order.status) === ORDER_STATUS_AWAITING_PAYMENT);

    if (payableItems.length > 0) {
      paymentSource = 'prepared_cart_checkout';
    }
  }

  if (payableItems.length === 0) {
    const cartSnapshot = await firestore.collection('carts').document(uid).collection('items').get();
    if (cartSnapshot.empty) {
      throw new HttpError(422, 'Carrinho vazio para pagamento', {
        code: 'EMPTY_CART'
      });
    }

    payableItems = cartSnapshot.docs.map((doc) => doc.data() || {});
  }

  const totalAmount = payableItems.reduce((sum, item) => {
    const itemAmount = Number(item.finalPrice || item.estimatedPrice || 0);
    return sum + (Number.isFinite(itemAmount) ? itemAmount : 0);
  }, 0);

  return {
    items: [
      {
        amount: toCents(totalAmount),
        description: `Carrinho (${payableItems.length} servicos)`,
        quantity: 1,
        code: cartOrderCode
      }
    ],
    customer: sanitizeCustomer(payload.customer, fallbackCustomer),
    payments: clonePayments(payload.payments),
    metadata: buildMetadata(payload.metadata, cartOrderCode, paymentSource),
    closed: payload.closed !== false
  };
}

async function authorizePaymentPayload({ payload, uid }) {
  const admin = initializeFirebase();
  const firestore = admin.firestore();
  const requestedOrderId = extractRequestedOrderId(payload);

  if (isCartCheckoutCode(requestedOrderId)) {
    return authorizeCartPayload({ firestore, payload, uid, requestedOrderId });
  }

  return authorizeSingleOrderPayload({
    firestore,
    payload,
    uid,
    orderId: requestedOrderId
  });
}

module.exports = {
  authorizePaymentPayload
};
