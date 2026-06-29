/**
 * Resolve o token FCM de um usuário.
 *
 * O app grava o token em `fcm_tokens/{uid}.token` e `users/{uid}.fcmToken`
 * (FirebaseNotificationManager). A coleção `userTokens` era lida em vários pontos
 * mas NUNCA é escrita por ninguém — então as notificações que dependiam dela
 * (expiração/reembolso, chat) não chegavam ao dispositivo.
 *
 * Tenta as fontes reais primeiro (`fcm_tokens` → `users.fcmToken`) e só cai em
 * `userTokens` por compatibilidade. Retorna o token (string) ou null.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} uid
 * @returns {Promise<string|null>}
 */
async function resolveUserFcmToken(db, uid) {
  if (!uid) return null;

  try {
    const snap = await db.collection('fcm_tokens').doc(uid).get();
    const t = snap.exists ? snap.data().token || snap.data().fcmToken : null;
    if (t) return t;
  } catch (_) {
    /* tenta a próxima fonte */
  }

  try {
    const snap = await db.collection('users').doc(uid).get();
    const t = snap.exists ? snap.data().fcmToken : null;
    if (t) return t;
  } catch (_) {
    /* tenta a próxima fonte */
  }

  try {
    const snap = await db.collection('userTokens').doc(uid).get();
    const t = snap.exists ? snap.data().token || snap.data().fcmToken : null;
    if (t) return t;
  } catch (_) {
    /* sem token */
  }

  return null;
}

module.exports = { resolveUserFcmToken };
