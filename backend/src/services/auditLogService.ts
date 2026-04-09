import * as fs from 'fs';
import * as path from 'path';

const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH || './logs/audit.log';

export type AuditAction =
  | 'router.save'
  | 'router.delete'
  | 'service.save'
  | 'service.delete'
  | 'middleware.save'
  | 'middleware.delete'
  | 'combined.router-service.create'
  | 'config.split';

export interface AuditEvent {
  action: AuditAction;
  resourceName?: string;
  revision?: string;
  actorIp?: string;
  actorUserAgent?: string;
}

export interface StoredAuditEvent extends AuditEvent {
  timestamp: string;
}

export class AuditLogService {
  private ensureAuditDirectory(): void {
    const dir = path.dirname(AUDIT_LOG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(event: AuditEvent): void {
    try {
      this.ensureAuditDirectory();
      const line = JSON.stringify({
        timestamp: new Date().toISOString(),
        ...event,
      });
      fs.appendFileSync(AUDIT_LOG_PATH, `${line}\n`, 'utf8');
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  list(options?: {
    action?: string;
    resource?: string;
    since?: string;
    limit?: number;
  }): StoredAuditEvent[] {
    const action = options?.action?.trim();
    const resource = options?.resource?.trim().toLowerCase();
    const since = options?.since?.trim();
    const sinceTime = since ? new Date(since).getTime() : Number.NaN;
    const hasValidSince = Number.isFinite(sinceTime);
    const limit = Math.max(1, Math.min(options?.limit ?? 50, 500));

    if (!fs.existsSync(AUDIT_LOG_PATH)) {
      return [];
    }

    const content = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

    const parsed: StoredAuditEvent[] = [];
    for (const line of lines) {
      try {
        const event = JSON.parse(line) as StoredAuditEvent;
        if (!event.timestamp || !event.action) {
          continue;
        }

        if (action && event.action !== action) {
          continue;
        }

        if (resource && !(event.resourceName || '').toLowerCase().includes(resource)) {
          continue;
        }

        if (hasValidSince) {
          const eventTime = new Date(event.timestamp).getTime();
          if (!Number.isFinite(eventTime) || eventTime < sinceTime) {
            continue;
          }
        }

        parsed.push(event);
      } catch {
        // Skip malformed lines and keep the endpoint resilient.
      }
    }

    return parsed.reverse().slice(0, limit);
  }
}

export const auditLogService = new AuditLogService();
