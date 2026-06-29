/**
 * Lógica PURA (sem Firestore/FCM) da notificação de novos pedidos a prestadores.
 * Extraída de provider-notification.service.js para ser testável (node:test).
 */

/**
 * Nicho do pedido. Pedidos NORMAIS gravam o nicho em `serviceName` (serviceType é o
 * serviço específico). Só o guincho usa `serviceCategory`. A correspondência é com
 * `providers.services` (array de nichos).
 * @returns {string} nicho (trim) ou '' se ausente.
 */
function extractOrderNiche(order) {
  return (
    (order && (order.serviceCategory || order.service_category_name || order.serviceName)) ||
    ''
  ).trim();
}

/**
 * O prestador deve receber o alerta? Precisa estar APROVADO e DISPONÍVEL.
 * `isAvailable` ausente conta como disponível (default true), igual ao app.
 */
function isProviderEligible(provider) {
  if (!provider) return false;
  const status = (provider.verificationStatus || '').toLowerCase();
  const isApproved =
    ['approved', 'verified', 'aprovado', 'verificado'].includes(status) ||
    provider.isVerified === true ||
    provider.verified === true;
  if (!isApproved) return false;
  // só exclui quem está explicitamente indisponível
  if (provider.isAvailable === false) return false;
  return true;
}

/**
 * Monta a mensagem FCM DATA-ONLY de novo pedido. Sem o bloco `notification` de topo:
 * assim o app morto/background recebe via onMessageReceived e dispara o som contínuo.
 * priority=high acorda o app mesmo fechado.
 */
function buildOrderFcmMessage(order, niche) {
  return {
    data: {
      type: 'order',
      order_id: String((order && order.id) || ''),
      niche: String(niche || ''),
      title: 'Novo pedido disponível',
      body: `Pedido de ${niche} aguardando prestador!`,
    },
    android: {
      priority: 'high',
    },
  };
}

module.exports = { extractOrderNiche, isProviderEligible, buildOrderFcmMessage };
