import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';

export type UserRole = 'SUPER_ADMIN' | 'PROVIDER' | 'COLLECTOR' | 'CUSTOMER';

export type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    role: UserRole;
    company_id: number | null;
  };
};

export function authenticateToken(jwtSecret: string, db?: any) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.sendStatus(401);
    }

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err || !user) {
        return res.sendStatus(403);
      }

      const tokenUser = user as AuthenticatedRequest['user'];
      if (!db || !tokenUser?.id) {
        req.user = tokenUser;
        next();
        return;
      }

      const currentUser: any = db
        .prepare(
          `
            SELECT u.id, u.role, u.company_id, u.status as user_status, c.status as company_status
            FROM users u
            LEFT JOIN companies c ON c.id = u.company_id
            WHERE u.id = ?
          `,
        )
        .get(tokenUser.id);

      if (!currentUser || currentUser.user_status !== 'active') {
        return res.status(403).json({message: 'User is deactivated'});
      }

      if (currentUser.role !== 'SUPER_ADMIN' && currentUser.company_status !== 'active') {
        return res.status(403).json({message: 'Company is deactivated'});
      }

      req.user = {
        id: currentUser.id,
        role: currentUser.role,
        company_id: currentUser.company_id,
      };
      next();
    });
  };
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.sendStatus(403);
    }
    next();
  };
}
