import { SocketRateLimiter } from "./socket-rate-limiter";

describe("SocketRateLimiter", () => {
  let limiter: SocketRateLimiter;

  beforeEach(() => {
    limiter = new SocketRateLimiter({
      test_event: { maxRequests: 3, windowMs: 1000 },
    });
  });

  it("should allow requests within the limit", () => {
    const socketId = "sock-1";
    expect(limiter.consume(socketId, "test_event", 100).allowed).toBe(true);
    expect(limiter.consume(socketId, "test_event", 200).allowed).toBe(true);
    expect(limiter.consume(socketId, "test_event", 300).allowed).toBe(true);
  });

  it("should reject requests exceeding maxRequests within the time window", () => {
    const socketId = "sock-1";
    limiter.consume(socketId, "test_event", 100);
    limiter.consume(socketId, "test_event", 200);
    limiter.consume(socketId, "test_event", 300);

    const fourth = limiter.consume(socketId, "test_event", 400);
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterMs).toBeGreaterThan(0);
  });

  it("should allow requests after time window expires", () => {
    const socketId = "sock-1";
    limiter.consume(socketId, "test_event", 100);
    limiter.consume(socketId, "test_event", 200);
    limiter.consume(socketId, "test_event", 300);

    // After 1000ms from the first request (e.g. at 1150ms), oldest request is outside window
    const later = limiter.consume(socketId, "test_event", 1150);
    expect(later.allowed).toBe(true);
  });

  it("should isolate limits per socketId", () => {
    limiter.consume("sock-1", "test_event", 100);
    limiter.consume("sock-1", "test_event", 200);
    limiter.consume("sock-1", "test_event", 300);

    // sock-1 is blocked
    expect(limiter.consume("sock-1", "test_event", 400).allowed).toBe(false);
    // sock-2 is independent and allowed
    expect(limiter.consume("sock-2", "test_event", 400).allowed).toBe(true);
  });

  it("should cleanup socket state when socket disconnects", () => {
    limiter.consume("sock-1", "test_event", 100);
    limiter.consume("sock-1", "test_event", 200);
    limiter.consume("sock-1", "test_event", 300);

    limiter.cleanupSocket("sock-1");

    // After cleanup, sock-1 starts fresh
    expect(limiter.consume("sock-1", "test_event", 400).allowed).toBe(true);
  });
});
