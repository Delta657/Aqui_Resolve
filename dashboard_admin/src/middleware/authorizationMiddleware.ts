import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

export class AuthorizationMiddleware {
  static requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Requer privilégios de administrador' });
    next();
  }

  static requireRole(roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (!req.user.role || !roles.includes(req.user.role)) return res.status(403).json({ success: false, message: `Role requerido: ${roles.join(', ')}` });
      next();
    };
  }
}

export type { AuthenticatedRequest as AuthRequest };
