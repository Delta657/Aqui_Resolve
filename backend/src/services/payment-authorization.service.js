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

function normalizeLower(value) {
  return normalizeString(value).toLowerCase();
}

function toCents(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(422, 'Valor do pedido inválido para pagamento', {
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
    throw new HttpError(400, 'O campo payments é obrigatório', {
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
    throw new HttpError(400, 'O campo customer é obrigatório', {
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
    throw new HttpError(404, 'Pedido não encontrado para pagamento', {
      code: 'ORDER_NOT_FOUND'
    });
  }

  const order = orderSnapshot.data() || {};
  if (normalizeString(order.clientId) !== uid) {
    throw new HttpError(403, 'Você não tem acesso a este pedido', {
      code: 'FORBIDDEN_ORDER'
    });
  }

  const orderStatus = normalizeLower(order.status);
  const paymentStatus = normalizeLower(order.paymentStatus);

  if (paymentStatus === PAYMENT_STATUS_PAID) {
    throw new HttpError(409, 'Este pedido já foi pago', {
      code: 'ORDER_ALREADY_PAID'
    });
  }

  const canBePaid =
    (orderStatus === ORDER_STATUS_AWAITING_PAYMENT || orderStatus === ORDER_STATUS_DRAFT) &&
    (!paymentStatus ||
      paymentStatus === ORDER_STATUS_AWAITING_PAYMENT ||
      paymentStatus === PAYMENT_STATUS_PENDING);

  if (!canBePaid) {
    throw new HttpError(409, 'Pedido não está disponível para um novo pagamento', {
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

async function authorizeCartPayload({ firestore, payload, uid }) {
  const cartSnapshot = await firestore.collection('carts').document(uid).collection('items').get();
  if (cartSnapshot.empty) {
    throw new HttpError(422, 'Carrinho vazio para pagamento', {
      code: 'EMPTY_CART'
    });
  }

  const cartItems = cartSnapshot.docs.map((doc) => doc.data() || {});
  const totalAmount = cartItems.reduce((sum, item) => {
    const estimatedPrice = Number(item.estimatedPrice || 0);
    return sum + (Number.isFinite(estimatedPrice) ? estimatedPrice : 0);
  }, 0);

  const fallbackCustomer = await loadUserFallbackData(firestore, uid);
  const cartOrderCode = `${CART_CHECKOUT_CODE}_${uid}_${Date.now()}`;

  return {
    items: [
      {
        amount: toCents(totalAmount),
        description: `Carrinho (${cartItems.length} serviços)`,
        quantity: 1,
        code: cartOrderCode
      }
    ],
    customer: sanitizeCustomer(payload.customer, fallbackCustomer),
    payments: clonePayments(payload.payments),
    metadata: buildMetadata(payload.metadata, cartOrderCode, 'cart_checkout'),
    closed: payload.closed !== false
  };
}

async function authorizePaymentPayload({ payload, uid }) {
  const admin = initializeFirebase();
  const firestore = admin.firestore();
  const requestedOrderId = extractRequestedOrderId(payload);

  if (requestedOrderId === CART_CHECKOUT_CODE) {
    return authorizeCartPayload({ firestore, payload, uid });
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
