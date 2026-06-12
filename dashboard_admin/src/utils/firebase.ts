import * as admin from 'firebase-admin';

function initAdmin(): admin.app.App | null {
  if (admin.apps.length > 0) return admin.app();

  const json = process.env['FIREBASE_SERVICE_ACCOUNT'];
  if (!json) {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT não configurado — Firebase Admin desativado.');
    return null;
  }

  try {
    let fixed = '';
    let inString = false;
    let escaped = false;
    for (const char of json) {
      if (escaped) { fixed += char; escaped = false; }
      else if (char === '\\' && inString) { fixed += char; escaped = true; }
      else if (char === '"') { inString = !inString; fixed += char; }
      else if (char === '\n' && inString) { fixed += '\\n'; }
      else { fixed += char; }
    }
    const sa = JSON.parse(fixed);
    if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
    return admin.initializeApp({ credential: admin.credential.cert(sa as admin.ServiceAccount) });
  } catch (err) {
    console.error('❌ Erro ao inicializar Firebase Admin:', err);
    return null;
  }
}

const app = initAdmin();

export const db = app ? admin.firestore(app) : null;
export const auth = app ? admin.auth(app) : null;

export { app };
