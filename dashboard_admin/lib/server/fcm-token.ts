import * as admin from 'firebase-admin'

/**
 * Resolve o token FCM de um usuário.
 *
 * O app grava o token em `fcm_tokens/{uid}.token` e em `users/{uid}.fcmToken`
 * (ver FirebaseNotificationManager). A coleção `userTokens` era lida por várias
 * rotas mas **nunca é escrita** por ninguém — então notificações que dependiam dela
 * (reembolso, status de pedido, broadcasts de chat) nunca chegavam ao dispositivo.
 *
 * Esta função tenta as fontes reais primeiro (`fcm_tokens` → `users.fcmToken`) e só
 * cai em `userTokens` por compatibilidade. Retorna o token ou null.
 */
export async function resolveUserFcmToken(
  db: admin.firestore.Firestore,
  uid: string
): Promise<string | null> {
  if (!uid) return null

  try {
    const snap = await db.collection('fcm_tokens').doc(uid).get()
    const t = snap.data()?.token || snap.data()?.fcmToken
    if (t) return String(t)
  } catch {
    /* tenta a próxima fonte */
  }

  try {
    const snap = await db.collection('users').doc(uid).get()
    const t = snap.data()?.fcmToken
    if (t) return String(t)
  } catch {
    /* tenta a próxima fonte */
  }

  try {
    const snap = await db.collection('userTokens').doc(uid).get()
    const t = snap.data()?.token || snap.data()?.fcmToken
    if (t) return String(t)
  } catch {
    /* sem token */
  }

  return null
}
