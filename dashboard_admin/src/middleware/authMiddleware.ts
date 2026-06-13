import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

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

function getAdminApp(): admin.app.App | null {
  if (admin.apps.length > 0) return admin.app();

  const json = process.env['FIREBASE_SERVICE_ACCOUNT'];
  if (!json) return null;

  try {
    const sa = parseServiceAccount(json);
    if (!sa) return null;

    return admin.initializeApp({
      credential: admin.credential.cert(sa as admin.ServiceAccount),
    });
  } catch {
    return null;
  }
}

export class AuthMiddleware {
  async authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ success: false, message: 'Token de autenticacao nao fornecido' });
      return;
    }

    const app = getAdminApp();
    if (!app) {
      res.status(503).json({ success: false, message: 'Firebase Admin nao configurado' });
      return;
    }

    try {
      const decoded = await admin.auth(app).verifyIdToken(token);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        role: (decoded['role'] as string) || (decoded['admin'] ? 'admin' : 'user'),
      };
      next();
    } catch {
      res.status(401).json({ success: false, message: 'Token invalido ou expirado' });
    }
  }

  requireRole(roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Usuario nao autenticado' });
        return;
      }
      if (!req.user.role || !roles.includes(req.user.role)) {
        res.status(403).json({ success: false, message: 'Acesso negado. Permissao insuficiente.' });
        return;
      }
      next();
    };
  }

  requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    this.requireRole(['admin'])(req, res, next);
  }

  requireAdminOrManager(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    this.requireRole(['admin', 'manager'])(req, res, next);
  }

  maskEmailInResponse(_req: Request, res: Response, next: NextFunction): void {
    const originalSend = res.send;
    const self = this;

    res.send = function (data: any) {
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.data && parsed.data.email) {
            parsed.data.email = self.maskEmail(parsed.data.email);
          }
          if (parsed.data && Array.isArray(parsed.data)) {
            parsed.data = parsed.data.map((item: any) => {
              if (item.email) item.email = self.maskEmail(item.email);
              return item;
            });
          }
          data = JSON.stringify(parsed);
        } catch {
          // mantém original se não for JSON
        }
      }
      return originalSend.call(this, data);
    };

    next();
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || localPart.length <= 2) return email;
    return localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1) + '@' + domain;
  }
}
