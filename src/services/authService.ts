const AUTH_BASE = '/api/auth'

export const AUTH_TOKEN_KEY    = 'tp_auth_token'
export const AUTH_SESSION_KEY  = 'tp_auth'
export const AUTH_EXPIRES_KEY  = 'tp_auth_expires'
export const AUTH_REMEMBER_KEY = 'tp_auth_remember'

export function getStoredAuthToken(): string | null {
  try { return localStorage.getItem(AUTH_TOKEN_KEY) } catch { return null }
}

export interface AuthAdmin {
  success: boolean
  id: number
  email: string
  role: string
  token: string
  expiresAt?: number
  error?: string
}

export interface AdminContact {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface OtpRequestResult {
  ok: boolean;
  notMember?: boolean;
  admins?: AdminContact[];
}

export interface MembershipRequestResult {
  ok: boolean;
  adminName?: string;
  error?: string;
}

export async function requestOtp(email: string): Promise<OtpRequestResult> {
  const res = await fetch(`${AUTH_BASE}/request-otp.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('Request failed')
  return await res.json() as OtpRequestResult
}

export async function requestMembership(
  email: string,
  adminId: number,
  birthMonth?: number,
  birthDay?: number,
): Promise<MembershipRequestResult> {
  const body: Record<string, unknown> = { email, adminId };
  if (birthMonth !== undefined) body.birthMonth = birthMonth;
  if (birthDay !== undefined) body.birthDay = birthDay;

  const res = await fetch(`${AUTH_BASE}/request-membership.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json() as MembershipRequestResult;
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? 'Request failed');
  }
  return data;
}

export async function verifyOtp(email: string, code: string, remember: boolean): Promise<AuthAdmin> {
  const res = await fetch(`${AUTH_BASE}/verify-otp.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, remember }),
  })
  const data = await res.json() as AuthAdmin
  if (!data.success) throw new Error(data.error ?? 'Verification failed')
  return data
}

export async function validateStoredSession(token: string): Promise<AuthAdmin | null> {
  try {
    const res = await fetch(`${AUTH_BASE}/session.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json() as AuthAdmin
    return data.success ? data : null
  } catch {
    return null
  }
}
