import { HttpError } from './security.mjs';

const messages = {
  NOT_FOUND: 'No account was found for this reference.',
  MEMBERSHIP_CHANGED: 'This membership changed. Look up the member again before confirming.',
  MANUAL_ACCESS_NOT_ACTIVE: 'This member has no active manual subscription to expire.',
  AMBIGUOUS_REFERENCE: 'This reference matches more than one account. Resolve the duplicate before granting access.',
  DUPLICATE_EMAIL_RECORDS: 'Duplicate subscription records need attention before changing this member.',
  MEMBERSHIP_OWNER_MISMATCH: 'The subscription record belongs to a different account. Resolve it before continuing.',
  RATE_LIMITED: 'Too many requests. Please wait a minute.',
};

export async function rpc(config, name, body) {
  let response;
  try {
    response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch { throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Could not reach the account service. Please try again.'); }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const knownMessage = messages[result?.message];
    if (knownMessage) {
      const status = /^PT\d{3}$/.test(result.code || '') ? Number(result.code.slice(2)) : 409;
      throw new HttpError(status, result.message, knownMessage);
    }
    throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'The account service is unavailable. Check the server setup.');
  }
  return result;
}

export function memberDto(row) {
  return {
    id: row.user_id, name: row.name, email: row.email, reference: row.reference_code,
    manualActive: row.manual_active, manualExpiresAt: row.manual_expires_at,
    activeUntil: row.manual_active ? row.manual_expires_at : null,
  };
}
