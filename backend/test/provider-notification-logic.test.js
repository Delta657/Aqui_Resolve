const { test } = require('node:test');
const assert = require('node:assert');
const {
  extractOrderNiche,
  isProviderEligible,
  buildOrderFcmMessage,
} = require('../src/utils/provider-notification-logic');

// ---- nicho do pedido ----

test('extractOrderNiche: pedido normal usa serviceName', () => {
  assert.strictEqual(extractOrderNiche({ serviceName: 'Elétrica', serviceType: 'Tomada' }), 'Elétrica');
});

test('extractOrderNiche: guincho usa serviceCategory', () => {
  assert.strictEqual(extractOrderNiche({ serviceCategory: 'Guincho', serviceName: 'x' }), 'Guincho');
});

test('extractOrderNiche: sem nicho retorna vazio', () => {
  assert.strictEqual(extractOrderNiche({}), '');
  assert.strictEqual(extractOrderNiche(null), '');
});

// ---- elegibilidade do prestador ----

test('isProviderEligible: aprovado + disponível => true', () => {
  assert.strictEqual(isProviderEligible({ verificationStatus: 'approved', isAvailable: true }), true);
  assert.strictEqual(isProviderEligible({ verificationStatus: 'aprovado' }), true); // isAvailable ausente = disponível
  assert.strictEqual(isProviderEligible({ isVerified: true }), true);
});

test('isProviderEligible: não aprovado => false', () => {
  assert.strictEqual(isProviderEligible({ verificationStatus: 'pending', isAvailable: true }), false);
  assert.strictEqual(isProviderEligible({}), false);
});

test('isProviderEligible: indisponível => false (não toca para quem está offline)', () => {
  assert.strictEqual(isProviderEligible({ verificationStatus: 'approved', isAvailable: false }), false);
});

// ---- mensagem FCM ----

test('buildOrderFcmMessage: data-only (sem notification) + priority high + type order', () => {
  const msg = buildOrderFcmMessage({ id: 'ord1' }, 'Elétrica');
  assert.strictEqual(msg.notification, undefined, 'NÃO pode ter bloco notification (senão não acorda o app fechado)');
  assert.strictEqual(msg.data.type, 'order');
  assert.strictEqual(msg.data.order_id, 'ord1');
  assert.strictEqual(msg.data.niche, 'Elétrica');
  assert.strictEqual(msg.android.priority, 'high');
  assert.ok(msg.data.title && msg.data.body);
});
