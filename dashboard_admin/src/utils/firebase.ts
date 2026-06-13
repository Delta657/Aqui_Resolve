import * as admin from 'firebase-admin';

function escapeNewlinesInsideJsonStrings(value: string): string {
  let fixed = '';
  let inString = false;
  let escaped = false;

  for (const char of value) {
    if (escaped) { fixed += char; escaped = false; }
    else if (char === '\\' && inString) { fixed += char; escaped = true; }
    else if (char === '"') { inString = !inString; fixed += char; }
    else if (char === '\n' && inString) { fixed += '\\n'; }
    else { fixed += char; }
  }

  return fixed;
}

function parseServiceAccount(json: string): admin.ServiceAccount | null {
  const trimmed = json.trim();
  const candidates = [trimmed];

  if (trimmed.includes('\\"')) {
    candidates.push(trimmed.replace(/\\"/g, '"'));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(escapeNewlinesInsideJsonStrings(candidate));
      if (!parsed || typeof parsed !== 'object') continue;
      if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      return parsed as admin.ServiceAccount;
    } catch {
      // Tenta o proximo formato suportado.
    }
  }

  return null;
}

function initAdmin(): admin.app.App | null {
  if (admin.apps.length > 0) return admin.app();

  const json = process.env['FIREBASE_SERVICE_ACCOUNT'];
  if (!json) {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT não configurado — Firebase Admin desativado.');
    return null;
  }

  try {
    const sa = parseServiceAccount(json);
    if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT invalido');
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
