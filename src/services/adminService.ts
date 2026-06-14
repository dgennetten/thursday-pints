import { Admin, AdminVisit, AddVisitPayload, AddBreweryPayload, UpdateVisitPayload, BirthdaysResponse, Member } from '../types';
import { getApiBase } from '../apiBase';

const API_BASE = getApiBase();

class AdminApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'AdminApiError';
  }
}

async function authFetch(
  token: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch { /* ignore */ }
    throw new AdminApiError(res.status, message);
  }
  return res;
}

export async function requestOtp(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/request-otp.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AdminApiError(res.status, data.error ?? 'Failed to send code');
  }
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<{ token: string; role: string; email: string }> {
  const res = await fetch(`${API_BASE}/admin/verify-otp.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new AdminApiError(res.status, data.error ?? 'Invalid code');
  return data;
}

export async function verifySession(
  token: string
): Promise<{ email: string; role: string } | null> {
  try {
    const res = await authFetch(token, `${API_BASE}/admin/me.php`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function getVisits(token: string): Promise<AdminVisit[]> {
  const res = await authFetch(token, `${API_BASE}/admin/visits.php`, { cache: 'no-store' });
  return res.json();
}

export async function addVisit(token: string, payload: AddVisitPayload): Promise<{ id: number }> {
  const res = await authFetch(token, `${API_BASE}/admin/add-visit.php`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateVisit(token: string, id: number, payload: UpdateVisitPayload): Promise<void> {
  await authFetch(token, `${API_BASE}/admin/visits.php`, {
    method: 'PUT',
    body: JSON.stringify({ id, ...payload }),
  });
}

export async function addBrewery(token: string, payload: AddBreweryPayload): Promise<void> {
  await authFetch(token, `${API_BASE}/admin/add-brewery.php`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getBreweryNames(token: string): Promise<string[]> {
  const res = await authFetch(token, `${API_BASE}/admin/brewery-names.php`);
  const data = await res.json();
  return data.names ?? [];
}

export async function getAdmins(token: string): Promise<Admin[]> {
  const res = await authFetch(token, `${API_BASE}/admin/admins.php`);
  return res.json();
}

export async function addAdmin(
  token: string,
  email: string,
  role: 'admin' | 'superadmin' | 'member',
  firstName?: string,
  lastName?: string,
  birthMonth?: number,
  birthDay?: number
): Promise<{ welcomeEmailSent?: boolean }> {
  const res = await authFetch(token, `${API_BASE}/admin/admins.php`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      role,
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName  ? { last_name:  lastName  } : {}),
      ...(birthMonth != null && birthDay != null ? { birth_month: birthMonth, birth_day: birthDay } : {}),
    }),
  });
  return res.json();
}

export async function fetchMembers(token: string): Promise<Member[]> {
  const res = await authFetch(token, `${API_BASE}/members.php`);
  const data = await res.json();
  return (data.members as Member[]) ?? [];
}

export async function fetchBirthdays(from: string, to: string, token?: string): Promise<BirthdaysResponse> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/birthdays.php?from=${from}&to=${to}`, {
      cache: 'no-store',
      headers,
    });
    if (!res.ok) return { birthdays: [], birthdayCount: 0 };
    const data = await res.json();
    return {
      birthdays: data.birthdays ?? [],
      birthdayCount: data.birthdayCount ?? (data.birthdays?.length ?? 0),
    };
  } catch {
    return { birthdays: [], birthdayCount: 0 };
  }
}

export async function updateAdminRole(
  token: string,
  id: number,
  role: 'admin' | 'superadmin'
): Promise<void> {
  await authFetch(token, `${API_BASE}/admin/admins.php`, {
    method: 'PATCH',
    body: JSON.stringify({ id, role }),
  });
}

export async function deleteAdmin(token: string, id: number): Promise<void> {
  await authFetch(token, `${API_BASE}/admin/admins.php`, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}
