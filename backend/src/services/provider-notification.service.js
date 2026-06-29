const admin = require('firebase-admin');
const logger = require('../utils/logger');
const { resolveUserFcmToken } = require('../utils/fcm-token');
const {
  extractOrderNiche,
  isProviderEligible,
  buildOrderFcmMessage,
} = require('../utils/provider-notification-logic');

/**
 * Serviço de notificação de novos pedidos para prestadores.
 *
 * Escuta mudanças em `orders` com status distributing/pending e envia FCM
 * para prestadores aprovados cujos nichos batem com o pedido.
 *
 * Inicializado no server.js (sem bloquear o startup em caso de erro).
 */
class ProviderNotificationService {
  constructor() {
    this.db = null;
    this.listener = null;
    this.started = false;
    this.fcmReady = false;
  }

  start() {
    if (this.started) return;

    // Verifica se Firebase Admin está inicializado
    if (!admin.apps || admin.apps.length === 0) {
      logger.warn('ProviderNotification: Firebase Admin não inicializado, pulando');
      return;
    }

    this.db = admin.firestore();
    this.started = true;

    // Verifica se FCM messaging está disponível
    try {
      admin.messaging();
      this.fcmReady = true;
      logger.info('ProviderNotification: FCM messaging disponível');
    } catch (_) {
      logger.warn('ProviderNotification: FCM messaging não disponível — notificações serão apenas locais');
    }

    const statuses = ['pending', 'distributing', 'available',
      'PENDING', 'DISTRIBUTING', 'AVAILABLE'];

    this.listener = this.db.collection('orders')
      .where('status', 'in', statuses)
      .onSnapshot(async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added') {
            const order = { id: change.doc.id, ...change.doc.data() };
            await this.notifyProviders(order).catch(err =>
              logger.error('Erro ao notificar prestadores', {
                orderId: order.id,
                error: err.message
              })
            );
          }
        }
      }, (err) => {
        logger.error('Listener de notificações de pedidos caiu', { error: err.message });
        this.started = false;
        // Tenta reiniciar após 10s
        setTimeout(() => this.start(), 10000);
      });

    logger.info('Serviço de notificação de pedidos para prestadores iniciado');
  }

  stop() {
    if (this.listener) {
      this.listener();
      this.listener = null;
    }
    this.started = false;
  }

  /**
   * Notifica prestadores aprovados cujos nichos batem com o pedido.
   */
  async notifyProviders(order) {
    // O nicho do pedido. Pedidos NORMAIS (CreateOrderActivity/carrinho) gravam o nicho
    // em `serviceName` (serviceType = serviço específico). Só o guincho grava
    // `serviceCategory`. Sem o fallback para `serviceName`, todo pedido comum ficava
    // "sem nicho" e NENHUM prestador era notificado por push (som com app fechado nunca
    // disparava p/ serviços comuns). A correspondência é com providers.services
    // (array de nichos), então `serviceName` é o campo certo.
    const niche = extractOrderNiche(order);
    if (!niche) {
      logger.warn('Pedido sem nicho, ignorando notificação', { orderId: order.id });
      return;
    }

    // Busca prestadores com o nicho correspondente
    const providersSnap = await this.db.collection('providers')
      .where('services', 'array-contains', niche)
      .get();

    if (providersSnap.empty) {
      logger.info('Nenhum prestador encontrado para o nicho', { niche, orderId: order.id });
      return;
    }

    const tokens = [];
    for (const doc of providersSnap.docs) {
      const provider = doc.data();

      // Aprovado + disponível (lógica pura testada)
      if (!isProviderEligible(provider)) continue;

      // Token FCM (fcm_tokens → users.fcmToken → fallback), não só fcm_tokens.
      const token = await resolveUserFcmToken(this.db, doc.id);
      if (token) tokens.push(token);
    }

    if (tokens.length === 0) {
      logger.info('Nenhum token FCM disponível para prestadores do nicho', { niche });
      return;
    }

    // Remove duplicatas
    const uniqueTokens = [...new Set(tokens)];

    // Envia FCM (se disponível)
    if (!this.fcmReady) {
      logger.info('FCM não disponível — notificação local apenas', { niche, count: uniqueTokens.length });
      return;
    }

    // Mensagem DATA-ONLY + priority high (ver provider-notification-logic):
    // acorda o app mesmo fechado e dispara o som contínuo via onMessageReceived.
    const message = buildOrderFcmMessage(order, niche);

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: uniqueTokens,
        ...message,
      });
      logger.info('FCM enviado para prestadores', {
        niche,
        orderId: order.id,
        success: response.successCount,
        failure: response.failureCount,
        tokens: uniqueTokens.length,
      });
    } catch (err) {
      logger.error('Erro ao enviar FCM multicast', { error: err.message, niche });
    }
  }
}

module.exports = new ProviderNotificationService();
