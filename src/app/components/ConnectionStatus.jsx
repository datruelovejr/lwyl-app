'use client';

import { useState, useEffect, useRef } from 'react';
import { createHealthMonitor } from '../../lib/health';

/**
 * ConnectionStatus -- a subtle banner that appears when Supabase is unreachable.
 * Shows "Reconnecting..." with retry count. Disappears when connection is restored.
 * Uses inline styles to match the app's existing pattern (no Tailwind).
 */
export default function ConnectionStatus() {
  const [status, setStatus] = useState({ connected: true, retryCount: 0, error: null });
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const monitorRef = useRef(null);

  useEffect(() => {
    const monitor = createHealthMonitor({
      interval: 30000,    // Check every 30s when healthy
      failedInterval: 5000, // Check every 5s when unhealthy
      onChange: (newStatus) => {
        setStatus(newStatus);
        if (!newStatus.connected) {
          setDismissed(false);
          setVisible(true);
        } else {
          // Show "reconnected" briefly, then hide
          setVisible(true);
          setTimeout(() => setVisible(false), 3000);
        }
      },
    });

    monitorRef.current = monitor;
    monitor.start();

    return () => monitor.stop();
  }, []);

  // Don't render if connected and not in the "just reconnected" window
  if (!visible || dismissed) return null;

  const isConnected = status.connected;

  const bannerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.3s ease',
    background: isConnected ? '#F0FDF4' : '#FFF7ED',
    borderBottom: `2px solid ${isConnected ? '#BBF7D0' : '#FED7AA'}`,
    color: isConnected ? '#15803D' : '#C2410C',
  };

  const dotStyle = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: isConnected ? '#15803D' : '#C2410C',
    animation: isConnected ? 'none' : 'pulse 1.5s ease-in-out infinite',
  };

  const dismissBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: isConnected ? '#15803D' : '#C2410C',
    padding: '0 4px',
    lineHeight: 1,
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div style={bannerStyle} role="alert" aria-live="polite">
        <span style={dotStyle} />
        {isConnected ? (
          <span>Connection restored</span>
        ) : (
          <span>
            Reconnecting to server
            {status.retryCount > 1 && ` (attempt ${status.retryCount})`}
            ...
          </span>
        )}
        <button
          style={dismissBtnStyle}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notification"
        >
          &times;
        </button>
      </div>
    </>
  );
}
