export interface AuditEvent {
  actorId: string;
  action: string;
  scope: string;
  metadata: Record<string, unknown>;
  timestamp?: string;
}

export function auditEvent(event: AuditEvent): AuditEvent {
  const normalizedEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString()
  };

  console.info("[audit]", JSON.stringify(normalizedEvent));
  return normalizedEvent;
}
