import type { JwtPayload } from 'jsonwebtoken';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & {
  user?: string | JwtPayload;
};
