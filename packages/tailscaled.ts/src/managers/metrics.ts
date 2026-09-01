import type { Transport } from "../transport"

/**
 * Diagnostic dumps from the daemon.
 *
 * Every method here returns plain text, not JSON. Parsing them as JSON is the
 * usual mistake.
 */
export class MetricsManager {
  constructor(private readonly transport: Transport) {}

  /** Prometheus metrics for the daemon itself. */
  daemon(): Promise<string> {
    return this.transport.text("metrics")
  }

  /** Prometheus metrics intended for end users. */
  user(): Promise<string> {
    return this.transport.text("usermetrics")
  }

  /** A full goroutine stack dump. Large. */
  goroutines(): Promise<string> {
    return this.transport.text("goroutines")
  }
}
