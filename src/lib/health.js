/**
 * Supabase connection health check.
 * Provides a lightweight ping to verify connectivity and measure latency.
 */

import { supabase } from './supabase';

/**
 * Pings Supabase with a minimal query to check connectivity.
 * @returns {Promise<{connected: boolean, latency: number, error: string|null}>}
 */
export async function checkSupabaseHealth() {
  const start = performance.now();
  try {
    // Use a lightweight query — select a single row with limit 1 from a known table.
    // This is the cheapest possible round-trip to verify the connection works.
    const { error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    const latency = Math.round(performance.now() - start);

    if (error) {
      return { connected: false, latency, error: error.message };
    }

    return { connected: true, latency, error: null };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return {
      connected: false,
      latency,
      error: err.message || 'Unable to reach the server',
    };
  }
}

/**
 * Creates a health monitor that periodically checks connectivity.
 * Returns an object with start/stop controls and a way to subscribe to status changes.
 *
 * @param {Object} options
 * @param {number} options.interval - polling interval in ms (default: 30000 — 30s)
 * @param {number} options.failedInterval - polling interval when unhealthy (default: 5000 — 5s)
 * @param {Function} options.onChange - callback({connected, latency, error, retryCount}) called on every check
 * @returns {{start: Function, stop: Function, check: Function}}
 */
export function createHealthMonitor(options = {}) {
  const {
    interval = 30000,
    failedInterval = 5000,
    onChange = () => {},
  } = options;

  let timerId = null;
  let retryCount = 0;
  let lastStatus = { connected: true, latency: 0, error: null, retryCount: 0 };

  async function check() {
    const result = await checkSupabaseHealth();

    if (result.connected) {
      // Was previously disconnected — reset retry count
      if (!lastStatus.connected) {
        retryCount = 0;
      }
    } else {
      retryCount++;
    }

    const status = {
      connected: result.connected,
      latency: result.latency,
      error: result.error,
      retryCount,
    };

    // Only notify if status changed or we're in a failure state
    const statusChanged = lastStatus.connected !== status.connected;
    if (statusChanged || !status.connected) {
      onChange(status);
    }

    lastStatus = status;

    // Adjust polling speed based on health
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = setTimeout(check, status.connected ? interval : failedInterval);
    }

    return status;
  }

  function start() {
    if (timerId !== null) return; // already running
    // Run first check immediately
    check();
    // The next timeout is set inside check() based on the result
    timerId = -1; // sentinel to indicate "running" until first check sets a real timer
  }

  function stop() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    retryCount = 0;
  }

  return { start, stop, check };
}
