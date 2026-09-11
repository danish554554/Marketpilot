/**
 * Session Lifecycle & Expiration Manager for MarketPilot
 * Enforces professional security practices:
 * - 4 hours idle inactivity timeout
 * - 24 hours maximum session lifetime ceiling
 * - Real-time JWT token expiration validation
 * - Cross-tab logout synchronization
 */

export const SESSION_KEYS = {
  TOKEN: 'marketpilot_token',
  REFRESH_TOKEN: 'marketpilot_refresh_token',
  EXPIRES_AT: 'marketpilot_session_expires_at',
  LAST_ACTIVE: 'marketpilot_last_active',
  USER_ID: 'marketpilot_user_id',
  EMAIL: 'marketpilot_email',
  BIZ: 'marketpilot_biz',
  FULL_NAME: 'marketpilot_full_name',
  TARGET_COUNTRY: 'marketpilot_target_country',
  LOGOUT_BROADCAST: 'marketpilot_logout_broadcast',
} as const;

// Idle inactivity timeout: 4 hours of no interaction
export const INACTIVITY_TIMEOUT_MS = 4 * 60 * 60 * 1000;

// Hard maximum session lifetime: 24 hours (1 day)
export const MAX_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;

/**
 * Decodes expiration timestamp (in milliseconds) from a standard JWT token.
 * Returns null if token is not a valid JWT or has no exp claim.
 */
export function decodeJwtExpiry(token: string): number | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (parsed && typeof parsed.exp === 'number') {
      return parsed.exp * 1000; // convert to ms
    }
  } catch (e) {
    // If decoding fails, return null
  }
  return null;
}

/**
 * Checks if the current stored session has expired.
 * Returns true if:
 * 1. No token exists
 * 2. JWT exp claim has passed
 * 3. Absolute session lifetime (24h) has passed
 * 4. Inactivity period (>4h idle) has passed
 */
export function isSessionExpired(): boolean {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem(SESSION_KEYS.TOKEN);
  if (!token) return true;

  const now = Date.now();

  // 1. Check JWT expiration claim if present
  const isDemo = token.startsWith('demo-');
  if (!isDemo && token.includes('.')) {
    const jwtExp = decodeJwtExpiry(token);
    if (jwtExp !== null && now >= jwtExp) {
      return true;
    }
  }

  // 2. Check stored absolute hard session expiration
  const storedExpiresAt = localStorage.getItem(SESSION_KEYS.EXPIRES_AT);
  if (storedExpiresAt) {
    const expiresAt = parseInt(storedExpiresAt, 10);
    if (!isNaN(expiresAt) && now >= expiresAt) {
      return true;
    }
  }

  // 3. Check idle / inactivity timeout (e.g., returning after hours or days)
  const storedLastActive = localStorage.getItem(SESSION_KEYS.LAST_ACTIVE);
  if (storedLastActive) {
    const lastActive = parseInt(storedLastActive, 10);
    if (!isNaN(lastActive) && now - lastActive > INACTIVITY_TIMEOUT_MS) {
      return true;
    }
  }

  return false;
}

/**
 * Saves or refreshes active session tokens and sets expiration bounds.
 */
export function saveAuthSession(token: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  localStorage.setItem(SESSION_KEYS.TOKEN, token);
  if (refreshToken) {
    localStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, refreshToken);
  }

  // Calculate session expiration timestamp
  const jwtExp = decodeJwtExpiry(token);
  const maxLimit = now + MAX_SESSION_LIFETIME_MS;
  const finalExpiresAt = jwtExp && jwtExp > now ? Math.min(jwtExp, maxLimit) : maxLimit;

  localStorage.setItem(SESSION_KEYS.EXPIRES_AT, String(finalExpiresAt));
  localStorage.setItem(SESSION_KEYS.LAST_ACTIVE, String(now));
}

/**
 * Updates the user's last active timestamp when user performs actions.
 * Throttled to avoid unnecessary writes.
 */
let lastActivityRecorded = 0;
export function recordUserActivity(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  // Throttle updates to once every 30 seconds
  if (now - lastActivityRecorded < 30000) return;
  lastActivityRecorded = now;

  // Only update if session is actually still valid
  const token = localStorage.getItem(SESSION_KEYS.TOKEN);
  if (token && !isSessionExpired()) {
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVE, String(now));
  }
}

/**
 * Clears all authentication credentials and notifies all tabs.
 */
export function clearAuthSession(broadcast: boolean = true): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SESSION_KEYS.TOKEN);
  localStorage.removeItem(SESSION_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(SESSION_KEYS.EXPIRES_AT);
  localStorage.removeItem(SESSION_KEYS.LAST_ACTIVE);
  localStorage.removeItem(SESSION_KEYS.USER_ID);
  localStorage.removeItem(SESSION_KEYS.EMAIL);
  localStorage.removeItem(SESSION_KEYS.BIZ);
  localStorage.removeItem(SESSION_KEYS.FULL_NAME);

  if (broadcast) {
    try {
      localStorage.setItem(SESSION_KEYS.LOGOUT_BROADCAST, String(Date.now()));
      window.dispatchEvent(new CustomEvent('marketpilot:logout', { detail: { reason: 'expired' } }));
    } catch {}
  }
}

/**
 * Pre-warms the backend API container to avoid cold-start delays.
 * Fires a lightweight non-blocking ping as soon as auth pages mount.
 */
let prewarmPromise: Promise<void> | null = null;
export function prewarmBackend(): void {
  if (typeof window === 'undefined') return;
  if (!prewarmPromise) {
    const healthUrl = 'https://marketpilot-r22y.onrender.com/health';
    prewarmPromise = fetch(healthUrl, { method: 'GET', mode: 'cors' })
      .then(() => {})
      .catch(() => {});
  }
}

// Background keep-alive to prevent Render container from sleeping while user has the tab open
if (typeof window !== 'undefined') {
  setInterval(() => {
    const healthUrl = 'https://marketpilot-r22y.onrender.com/health';
    fetch(healthUrl, { method: 'GET', mode: 'cors' }).catch(() => {});
  }, 4 * 60 * 1000); // ping every 4 minutes
}

