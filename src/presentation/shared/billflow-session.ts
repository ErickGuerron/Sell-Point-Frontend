export interface BillflowSessionData {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  [key: string]: unknown;
}

const SESSION_COOKIE = 'billflow-session';

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseBillflowSession(value: string | null | undefined): BillflowSessionData | null {
  if (!value) return null;

  const decoded = decodeCookieValue(value);

  try {
    return JSON.parse(decoded) as BillflowSessionData;
  } catch {
    return null;
  }
}

export function getBillflowSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function serializeBillflowSession(session: BillflowSessionData): string {
  return JSON.stringify(session);
}

function encodeBillflowSessionCookie(session: BillflowSessionData): string {
  return encodeURIComponent(JSON.stringify(session));
}

export function readBillflowSessionCookie(): BillflowSessionData | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${SESSION_COOKIE}=`));

  if (!cookie) return null;

  return parseBillflowSession(cookie.slice(SESSION_COOKIE.length + 1));
}

export function writeBillflowSessionCookie(session: BillflowSessionData): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${SESSION_COOKIE}=${encodeBillflowSessionCookie(session)}; path=/; SameSite=Lax`;
}

export function clearBillflowSessionCookie(): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${SESSION_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
}
