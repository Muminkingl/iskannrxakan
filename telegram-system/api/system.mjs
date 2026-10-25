import { authenticate, createConfirmation, HttpError, isUuid, OWNER_ID, readConfig, validateFields, verifyConfirmation } from '../lib/security.mjs';
import { json, readJson, respondError } from '../lib/http.mjs';
import { memberDto, rpc } from '../lib/database.mjs';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    const config = readConfig();
    const owner = authenticate(req, config);
    const body = await readJson(req);
    validateFields(body, ['action', 'search', 'cursor', 'reference', 'userId', 'confirmation']);
    const allowed = {
      session: ['action'], members: ['action', 'search', 'cursor'],
      lookup: ['action', 'reference'], prepare_expire: ['action', 'userId'],
      grant: ['action', 'confirmation'], expire: ['action', 'confirmation'],
    };
    if (!Object.hasOwn(allowed, body.action)) throw new HttpError(400, 'INVALID_ACTION', 'Choose a valid action.');
    validateFields(body, allowed[body.action]);
    await rpc(config, 'telegram_system_rate_limit', { p_actor_id: OWNER_ID, p_bucket: ['grant', 'expire'].includes(body.action) ? 'write' : 'read' });

    if (body.action === 'session') return json(res, 200, { owner, system: 'Iskan System' });
    if (body.action === 'members') {
      if (body.search !== undefined && (typeof body.search !== 'string' || body.search.length > 120)) throw new HttpError(400, 'INVALID_SEARCH', 'Search is too long.');
      if (body.cursor !== undefined && body.cursor !== null && !isUuid(body.cursor)) throw new HttpError(400, 'INVALID_CURSOR', 'The page is invalid.');
      const data = await rpc(config, 'telegram_system_members', { p_search: body.search?.trim() || '', p_after: body.cursor || null, p_limit: 30 });
      return json(res, 200, { ...data, items: data.items.map(memberDto) });
    }
    if (body.action === 'lookup') {
      const reference = typeof body.reference === 'string' ? body.reference.trim().toUpperCase() : '';
      if (!/^[A-Z0-9][A-Z0-9-]{3,39}$/.test(reference)) throw new HttpError(400, 'INVALID_REFERENCE', 'Enter the complete account reference from WhatsApp.');
      const member = await rpc(config, 'telegram_system_lookup', { p_reference: reference });
      if (!member) throw new HttpError(404, 'NOT_FOUND', 'No account was found for this reference.');
      return json(res, 200, { member: memberDto(member), confirmation: createConfirmation(member, 'grant', config.confirmationSecret) });
    }
    if (body.action === 'prepare_expire') {
      if (!isUuid(body.userId)) throw new HttpError(400, 'INVALID_MEMBER', 'Choose a valid member.');
      const member = await rpc(config, 'telegram_system_member', { p_user_id: body.userId });
      if (!member) throw new HttpError(404, 'NOT_FOUND', 'This account is unavailable.');
      if (!member.manual_active) throw new HttpError(409, 'MANUAL_ACCESS_NOT_ACTIVE', 'This member has no active manual subscription to expire.');
      return json(res, 200, { member: memberDto(member), confirmation: createConfirmation(member, 'expire', config.confirmationSecret) });
    }
    const confirmation = verifyConfirmation(body.confirmation, body.action, config.confirmationSecret);
    const result = await rpc(config, 'telegram_system_change_membership', {
      p_actor_id: OWNER_ID, p_action: confirmation.action, p_user_id: confirmation.userId,
      p_operation_id: confirmation.operationId, p_expected_revision: confirmation.revision,
    });
    return json(res, 200, result);
  } catch (error) { return respondError(res, error); }
}
