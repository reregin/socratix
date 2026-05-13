import type { JwtPayload } from 'jsonwebtoken';

export function resolveUserId(user?: string | JwtPayload): string {
  if (!user) {
    return 'anonymous';
  }

  if (typeof user === 'string') {
    return user;
  }

  const subject = user.sub;
  if (typeof subject === 'string' && subject.length > 0) {
    return subject;
  }

  return 'anonymous';
}

export function sanitizePath(path?: string): string {
  if (!path) {
    return '/';
  }

  const [pathname] = path.split('?');
  return pathname || '/';
}
