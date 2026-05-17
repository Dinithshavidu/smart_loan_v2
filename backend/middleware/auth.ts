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

export function authenticateToken(jwtSecret: string) {
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

      req.user = user as AuthenticatedRequest['user'];
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
