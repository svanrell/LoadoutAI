export interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
}

export const DEFAULT_SOCKET_RATE_LIMITS: Record<string, RateLimitRule> = {
  request_player_profile: { maxRequests: 5, windowMs: 10_000 },
  request_ml_draft: { maxRequests: 10, windowMs: 5_000 },
  pregame_select: { maxRequests: 5, windowMs: 2_000 },
  pregame_lock: { maxRequests: 3, windowMs: 5_000 },
  update_ingame_credits: { maxRequests: 20, windowMs: 5_000 },
};

export class SocketRateLimiter {
  private readonly rules: Record<string, RateLimitRule>;
  // socketId -> (eventName -> array of timestamps in ms)
  private readonly clients = new Map<string, Map<string, number[]>>();

  constructor(
    rules: Record<string, RateLimitRule> = DEFAULT_SOCKET_RATE_LIMITS,
  ) {
    this.rules = rules;
  }

  /**
   * Intenta consumir 1 token para el socket y evento dados.
   * Si excede el límite permitido en la ventana de tiempo, devuelve allowed: false.
   */
  public consume(
    socketId: string,
    eventName: string,
    now: number = Date.now(),
  ): { allowed: boolean; retryAfterMs?: number } {
    const rule = this.rules[eventName];
    if (!rule) {
      // Eventos sin regla explícita no están limitados
      return { allowed: true };
    }

    let socketEvents = this.clients.get(socketId);
    if (!socketEvents) {
      socketEvents = new Map<string, number[]>();
      this.clients.set(socketId, socketEvents);
    }

    const windowStart = now - rule.windowMs;
    const timestamps = (socketEvents.get(eventName) || []).filter(
      (t) => t > windowStart,
    );

    if (timestamps.length >= rule.maxRequests) {
      const oldestInWindow = timestamps[0];
      const retryAfterMs = Math.max(
        100,
        rule.windowMs - (now - oldestInWindow),
      );
      socketEvents.set(eventName, timestamps);
      return { allowed: false, retryAfterMs };
    }

    timestamps.push(now);
    socketEvents.set(eventName, timestamps);
    return { allowed: true };
  }

  /**
   * Libera toda la memoria y seguimiento del socket cuando este se desconecta.
   */
  public cleanupSocket(socketId: string): void {
    this.clients.delete(socketId);
  }

  public reset(): void {
    this.clients.clear();
  }
}
