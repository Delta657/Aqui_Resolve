const express = require('express');
const admin = require('firebase-admin');

const { authenticateRequest } = require('../middlewares/auth');
const logger = require('../utils/logger');

const router = express.Router();

router.use(authenticateRequest);

/**
 * POST /api/chat-notify
 * Envia notificação FCM com som para o destinatário de uma mensagem de chat.
 *
 * Body:
 *   recipientUid  (string) — UID do destinatário
 *   orderId       (string) — ID do pedido
 *   senderName    (string) — nome de quem enviou
 *   message       (string) — preview da mensagem (até 100 chars)
 *   senderType    (string) — "client" ou "provider"
 */
router.post('/', async (req, res) => {
  try {
    const { recipientUid, orderId, senderName, message, senderType } = req.body;

    if (!recipientUid || !orderId || !senderName || !message) {
      return res.status(400).json({
        ok: false,
        error: 'Campos obrigatórios: recipientUid, orderId, senderName, message'
      });
    }

    if (!admin.apps.length || !process.env.FIREBASE_PROJECT_ID) {
      logger.warn('chat-notify: Firebase Admin não inicializado, ignorando envio');
      return res.status(200).json({ ok: true, sent: false, reason: 'firebase_admin_unavailable' });
    }

    // Buscar FCM token do destinatário
    const db = admin.firestore();
    const tokenSnap = await db.collection('userTokens').doc(recipientUid).get();

    if (!tokenSnap.exists) {
      logger.info('chat-notify: destinatário sem token FCM', { recipientUid });
      return res.status(200).json({ ok: true, sent: false, reason: 'no_fcm_token' });
    }

    const token = tokenSnap.data()?.token || tokenSnap.data()?.fcmToken;
    if (!token) {
      return res.status(200).json({ ok: true, sent: false, reason: 'no_fcm_token' });
    }

    // Truncar mensagem para preview da notificação
    const preview = message.length > 120
      ? message.substring(0, 117) + '...'
      : message;

    const notification = {
      title: senderName,
      body: preview
    };

    const data = {
      type: 'chat_message',
      order_id: orderId,
      orderId: orderId,
      senderType: senderType || 'unknown',
      click_action: 'OPEN_ORDER_CHAT'
    };

    const messaging = admin.messaging();

    // Enviar com som e vibração via payload Android
    await messaging.send({
      token,
      notification,
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'messages_channel',
          priority: 'high',
          visibility: 'public'
        }
      }
    });

    logger.info('chat-notify: FCM enviado', {
      from: req.user?.uid,
      to: recipientUid,
      orderId,
      tokenPreview: token.substring(0, 20) + '...'
    });

    return res.status(200).json({ ok: true, sent: true });
  } catch (error) {
    logger.error('chat-notify: erro ao enviar FCM', {
      error: error.message,
      recipientUid: req.body?.recipientUid,
      orderId: req.body?.orderId
    });

    // Não retorna 500 para o cliente — a mensagem já foi salva no Firestore
    return res.status(200).json({
      ok: true,
      sent: false,
      reason: 'fcm_error',
      error: error.message
    });
  }
});

module.exports = router;
