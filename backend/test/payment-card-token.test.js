const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

const BILLING = {
  line_1: 'Rua A, 10',
  zip_code: '01001-000',
  city: 'Sao Paulo',
  state: 'SP',
  country: 'BR'
};

function loadService({ requireToken = false } = {}) {
  process.env.PAGARME_REQUIRE_CARD_TOKEN = requireToken ? 'true' : 'false';
  delete require.cache[require.resolve('../src/config/env')];
  delete require.cache[require.resolve('../src/services/payment-authorization.service')];
  return require('../src/services/payment-authorization.service');
}

beforeEach(() => {
  delete process.env.PAGARME_REQUIRE_CARD_TOKEN;
});

test('card_token: envia so o token + billing_address, sem dados do cartao', () => {
  const { preparePaymentsForGateway } = loadService();
  const [payment] = preparePaymentsForGateway(
    [{ payment_method: 'credit_card', credit_card: { card_token: 'token_abc', billing_address: BILLING } }],
    'pedido_1'
  );

  assert.strictEqual(payment.credit_card.card_token, 'token_abc');
  assert.deepStrictEqual(payment.credit_card.card, {
    billing_address: { ...BILLING, zip_code: '01001000', line_2: undefined }
  });
  assert.strictEqual(payment.credit_card.billing_address, undefined);
  assert.strictEqual(payment.credit_card.installments, 1);
  assert.strictEqual(payment.credit_card.statement_descriptor, 'AQUIRESOLVE');
});

test('cartao legado do APK continua convertido para o formato v5', () => {
  const { preparePaymentsForGateway } = loadService();
  const [payment] = preparePaymentsForGateway(
    [{
      payment_method: 'credit_card',
      credit_card: {
        card: {
          card_number: '4000 0000 0000 0010',
          card_holder_name: 'Fulano',
          card_expiration_date: '1230',
          card_cvv: '123'
        },
        billing_address: BILLING
      }
    }],
    'pedido_1'
  );

  const { card } = payment.credit_card;
  assert.strictEqual(card.number, '4000000000000010');
  assert.strictEqual(card.exp_month, 12);
  assert.strictEqual(card.exp_year, 30);
  assert.strictEqual(card.card_number, undefined);
  assert.strictEqual(payment.credit_card.card_token, undefined);
});

test('PAGARME_REQUIRE_CARD_TOKEN recusa cartao aberto e aceita token', () => {
  const { preparePaymentsForGateway } = loadService({ requireToken: true });

  assert.throws(
    () => preparePaymentsForGateway(
      [{ payment_method: 'credit_card', credit_card: { card: { card_number: '4000000000000010' } } }],
      'pedido_1'
    ),
    (error) => error.details?.code === 'CARD_TOKEN_REQUIRED' || error.code === 'CARD_TOKEN_REQUIRED'
  );

  const [payment] = preparePaymentsForGateway(
    [{ payment_method: 'credit_card', credit_card: { card_token: 'token_abc' } }],
    'pedido_1'
  );
  assert.strictEqual(payment.credit_card.card_token, 'token_abc');
});

test('statement_descriptor enviado pelo app e cortado em 13 caracteres', () => {
  const { preparePaymentsForGateway } = loadService();
  const [payment] = preparePaymentsForGateway(
    [{ payment_method: 'credit_card', credit_card: { card_token: 't', statement_descriptor: 'AQUIRESOLVE SERVICOS' } }],
    'pedido_1'
  );
  assert.strictEqual(payment.credit_card.statement_descriptor, 'AQUIRESOLVE S');
});
