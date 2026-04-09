import { Request, Response } from 'express';
import { ConfigConflictError } from '../services/configService';

export function getExpectedRevision(req: Request): string | undefined {
  const revision = req.header('x-config-revision');
  return revision ? revision.trim() : undefined;
}

export function setRevisionHeader(res: Response, revision: string): void {
  res.setHeader('x-config-revision', revision);
}

export function handleRouteError(
  res: Response,
  error: unknown,
  fallbackMessage: string
): Response {
  if (error instanceof ConfigConflictError) {
    return res.status(409).json({
      error: 'Configuration changed since your last read. Reload and retry.',
      currentRevision: error.currentRevision,
    });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
}

export function getActorIp(req: Request): string | undefined {
  const forwardedFor = req.header('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim();
  }

  return req.ip;
}
